import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import UsersTable from './components/UsersTable';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35', // Orange color matching mobile app
    },
    secondary: {
      main: '#f5f5f5',
    },
  },
  typography: {
    h5: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🚗 Администраторски панел - Пътна помощ
            </Typography>
            <Typography variant="body2">
              v1.0
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <UsersTable />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
