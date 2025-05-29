import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Chip,
  Typography,
  Button,
  Menu,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams
} from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ToggleOn,
  ToggleOff,
  VerifiedUser as VerifiedIcon,
  PersonOff as UnverifiedIcon,
  Phone as PhoneIcon,
  Build as MigrationIcon,
  PhotoCamera as TestImageIcon
} from '@mui/icons-material';
import { User, UserTableRow } from '../types/User';
import { 
  getAllUsers, 
  deleteUser, 
  toggleUserStatus, 
  approveDriver, 
  rejectDriver,
  togglePhoneVerification,
  getDocumentVerificationSummary
} from '../services/userService';
import { migrateUsersAddDocumentFields } from '../services/migrationService';
import UserEditDialog from './UserEditDialog';
import ImageTestDialog from './ImageTestDialog';

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [error, setError] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [imageTestOpen, setImageTestOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading users from Firestore...');
      const usersData = await getAllUsers();
      console.log('✅ Loaded users:', usersData.length);
      console.log('👥 Users data:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setError('Грешка при зареждане на потребителите');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleMigration = async () => {
    if (!window.confirm('Сигурни ли сте, че искате да стартирате миграция на потребителите? Това ще добави липсващите полета за документи на шофьорите.')) {
      return;
    }
    
    try {
      setMigrating(true);
      await migrateUsersAddDocumentFields();
      await loadUsers(); // Reload users after migration
      showSnackbar('Миграцията завърши успешно!', 'success');
    } catch (error) {
      showSnackbar('Грешка при миграция', 'error');
    } finally {
      setMigrating(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Сигурни ли сте, че искате да изтриете ${user.fullName}?`)) {
      try {
        await deleteUser(user.id);
        showSnackbar('Потребителят е изтрит успешно', 'success');
        loadUsers();
      } catch (error) {
        showSnackbar('Грешка при изтриване на потребителя', 'error');
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id, user.isActive || false);
      showSnackbar(
        `Потребителят е ${user.isActive ? 'деактивиран' : 'активиран'} успешно`,
        'success'
      );
      loadUsers();
    } catch (error) {
      showSnackbar('Грешка при промяна на статуса', 'error');
    }
  };

  const handleToggleVerification = async (user: User) => {
    try {
      await togglePhoneVerification(user.id, user.phoneVerified);
      showSnackbar(
        `Телефонът е ${user.phoneVerified ? 'отверифициран' : 'верифициран'} успешно`,
        'success'
      );
      loadUsers();
    } catch (error) {
      showSnackbar('Грешка при промяна на верификацията', 'error');
    }
  };

  const handleApprove = async (user: User) => {
    try {
      await approveDriver(user.id);
      showSnackbar('Шофьорът е одобрен успешно', 'success');
      loadUsers();
      handleMenuClose();
    } catch (error) {
      showSnackbar('Грешка при одобряване на шофьора', 'error');
    }
  };

  const handleReject = async (user: User) => {
    try {
      await rejectDriver(user.id);
      showSnackbar('Шофьорът е отхвърлен', 'success');
      loadUsers();
      handleMenuClose();
    } catch (error) {
      showSnackbar('Грешка при отхвърляне на шофьора', 'error');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'fullName',
      headerName: 'Име',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.userType === 'driver' ? 'Шофьор' : 'Клиент'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'email',
      headerName: 'Имейл',
      width: 250
    },
    {
      field: 'phone',
      headerName: 'Телефон',
      width: 150
    },
    {
      field: 'phoneVerified',
      headerName: 'Верифициран',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Да' : 'Не'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 200,
      renderCell: (params) => {
        if (params.row.userType === 'client') {
          return (
            <Chip
              label={params.row.isActive ? 'Активен' : 'Неактивен'}
              color={params.row.isActive ? 'success' : 'default'}
              size="small"
            />
          );
        }
        
        // For drivers, show document verification status
        const user = params.row as User;
        const summary = getDocumentVerificationSummary(user);
        
        if (summary.allApproved) {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Chip
                label="✅ Всички документи одобрени"
                color="success"
                size="small"
              />
              <Chip
                label={user.isActive ? 'Активен' : 'Неактивен'}
                color={user.isActive ? 'success' : 'default'}
                size="small"
              />
            </Box>
          );
        } else if (summary.rejectedCount > 0) {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Chip
                label={`❌ ${summary.rejectedCount} отхвърлени`}
                color="error"
                size="small"
              />
              <Chip
                label={`⏳ ${summary.pendingCount} чакат`}
                color="warning"
                size="small"
              />
            </Box>
          );
        } else {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Chip
                label={`⏳ ${summary.pendingCount} документа чакат`}
                color="warning"
                size="small"
              />
              <Chip
                label={`✅ ${summary.approvedCount} одобрени`}
                color={summary.approvedCount > 0 ? 'success' : 'default'}
                size="small"
              />
            </Box>
          );
        }
      }
    },
    {
      field: 'companyName',
      headerName: 'Фирма',
      width: 200,
      valueGetter: (value: any, row: User) => row.companyInfo?.name || '-'
    },
    {
      field: 'createdAt',
      headerName: 'Създаден',
      width: 130,
      valueFormatter: (value: any) => {
        return new Date(value).toLocaleDateString('bg-BG');
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      width: 120,
      getActions: (params: GridRowParams<User>) => {
        const user = params.row;
        const actions = [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Редактирай/Прегледай"
            onClick={() => handleEdit(user)}
          />
        ];

        // За шофьори добавяме менюто за документи
        if (user.userType === 'driver') {
          actions.push(
            <GridActionsCellItem
              icon={<MoreVertIcon />}
              label="Повече опции"
              onClick={(event) => handleMenuClick(event, user)}
            />
          );
        } else {
          // За клиенти добавяме само toggle статус
          actions.push(
            <GridActionsCellItem
              icon={user.isActive ? <ToggleOff /> : <ToggleOn />}
              label={user.isActive ? "Деактивирай" : "Активирай"}
              onClick={() => handleToggleStatus(user)}
            />
          );
        }

        return actions;
      }
    }
  ];

  const rows: UserTableRow[] = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    userType: user.userType,
    createdAt: user.createdAt.toISOString(),
    status: user.status,
    isActive: user.isActive,
    companyInfo: user.companyInfo
  }));

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Управление на потребители
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined"
            color="info"
            startIcon={<TestImageIcon />}
            onClick={() => setImageTestOpen(true)}
          >
            ТЕСТ СНИМКА
          </Button>
          <Button 
            variant="outlined"
            color="warning"
            startIcon={<MigrationIcon />}
            onClick={handleMigration}
            disabled={migrating}
          >
            {migrating ? 'Мигрира...' : 'Мигрирай документи'}
          </Button>
          <Button variant="contained" onClick={loadUsers}>
            Обнови
          </Button>
        </Box>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } }
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedUser?.userType === 'driver' && (
          <>
            {selectedUser?.status === 'pending' && (
              <MenuItem onClick={() => selectedUser && handleApprove(selectedUser)}>
                <ApproveIcon sx={{ mr: 1, color: 'success.main' }} />
                Одобри шофьора
              </MenuItem>
            )}
            {selectedUser?.status !== 'rejected' && (
              <MenuItem onClick={() => selectedUser && handleReject(selectedUser)}>
                <RejectIcon sx={{ mr: 1, color: 'error.main' }} />
                Отхвърли шофьора
              </MenuItem>
            )}
            <MenuItem onClick={() => selectedUser && handleToggleStatus(selectedUser)}>
              {selectedUser?.isActive ? <ToggleOff sx={{ mr: 1 }} /> : <ToggleOn sx={{ mr: 1 }} />}
              {selectedUser?.isActive ? "Деактивирай" : "Активирай"}
            </MenuItem>
            <MenuItem onClick={() => selectedUser && handleToggleVerification(selectedUser)}>
              {selectedUser?.phoneVerified ? <UnverifiedIcon sx={{ mr: 1 }} /> : <VerifiedIcon sx={{ mr: 1 }} />}
              {selectedUser?.phoneVerified ? "Премахни верификация" : "Верифицирай телефон"}
            </MenuItem>
            <MenuItem onClick={() => selectedUser && handleDelete(selectedUser)} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Изтрий потребител
            </MenuItem>
          </>
        )}
      </Menu>

      <UserEditDialog
        open={editDialogOpen}
        user={editUser}
        onClose={() => {
          setEditDialogOpen(false);
          setEditUser(null);
        }}
        onUserUpdated={loadUsers}
      />

      <ImageTestDialog
        open={imageTestOpen}
        onClose={() => setImageTestOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 