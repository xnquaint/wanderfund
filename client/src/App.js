import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import TripsList from './components/TripsList';
import CreateTripForm from './components/CreateTripForm';
import TripDetails from './components/TripDetails';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  ThemeProvider,
  createTheme,
  Paper,
  CircularProgress,
  Link,
  Grid,
  Alert,
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const theme = createTheme({
  palette: {
    primary: { main: '#2E7D32', light: '#60ad5e', dark: '#005005' },
    secondary: { main: '#FFC107' },
    background: { default: '#e8f5e9', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: '#2E7D32' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', padding: '10px 20px' },
        containedPrimary: { '&:hover': { backgroundColor: '#005005' } },
      },
    },
    MuiAppBar: {
        styleOverrides: {
            root: { backgroundColor: '#ffffff', color: '#2E7D32'}
        }
    }
  },
});

function App() {
  const [token, setToken] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [view, setView] = useState('login');
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [tripsListKey, setTripsListKey] = useState(0);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      setView('tripsList');
    } else {
      setView('login');
    }
    setLoadingToken(false);
  }, []);

  const handleSetToken = (newToken) => {
    setAuthMessage('');
    if (newToken) {
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setView('tripsList');
    } else {
      localStorage.removeItem('authToken');
      setToken(null);
      setView('login');
      setSelectedTripId(null);
    }
  };

  const handleLogout = () => {
    setAuthMessage('');
    handleSetToken(null);
  };

  const handleTripCreated = (newTrip) => {
    setAuthMessage('');
    setView('tripsList');
    setTripsListKey(prevKey => prevKey + 1);
  };

  const handleViewTripDetails = (tripId) => {
    setAuthMessage('');
    setSelectedTripId(tripId);
    setView('tripDetails');
  };

  const handleBackToTripsList = () => {
    setAuthMessage('');
    setSelectedTripId(null);
    setView('tripsList');
    setTripsListKey(prevKey => prevKey + 1);
  };

  const switchToRegister = () => {
    setAuthMessage('');
    setView('register');
  };

  const switchToLogin = (message = '') => {
    setAuthMessage(message);
    setView('login');
  };


  if (loadingToken) {
    return (
      <ThemeProvider theme={theme}> <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <FlightTakeoffIcon sx={{ mr: 1.5, fontSize: '2rem', cursor: token ? 'pointer' : 'default' }} onClick={token ? handleBackToTripsList : null} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: token ? 'pointer' : 'default' }} onClick={token ? handleBackToTripsList : null}>
              WanderFund
            </Typography>
            {token && (
              <Button
                color="primary"
                variant="outlined"
                onClick={handleLogout}
                sx={{borderColor: theme.palette.primary.light, '&:hover': {borderColor: theme.palette.primary.main}}}
              >
                Вийти
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Container
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: (view === 'login' || view === 'register') ? 'center' : 'flex-start',
            py: (view === 'login' || view === 'register') ? 2 : 4,
            width: '100%'
          }}
        >
          {view === 'login' && !token && (
            <Paper
              elevation={6}
              sx={{ padding: { xs: 3, sm: 4 }, borderRadius: theme.shape.borderRadius, maxWidth: '450px', width: '100%' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <LockOpenIcon color="primary" sx={{ fontSize: 40, mb:1 }}/>
              </Box>
              {authMessage && (
                <Alert severity="success" sx={{ mb: 2, width: '100%' }} onClose={() => setAuthMessage('')}>
                  {authMessage}
                </Alert>
              )}
              <Login setToken={handleSetToken} />
              <Grid container justifyContent="center" sx={{mt: 2}}>
                <Grid item>
                  <Link href="#" variant="body2" onClick={(e) => { e.preventDefault(); switchToRegister(); }}>
                    Немає акаунту? Зареєструватися
                  </Link>
                </Grid>
              </Grid>
            </Paper>
          )}

          {view === 'register' && !token && (
            <Paper
              elevation={6}
              sx={{ padding: { xs: 3, sm: 4 }, borderRadius: theme.shape.borderRadius, maxWidth: '500px', width: '100%' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <PersonAddIcon color="primary" sx={{ fontSize: 40, mb:1 }}/>
                <Typography component="h1" variant="h5">Створення акаунту</Typography>
              </Box>
              <Register
                onRegisterSuccess={() => {
                  switchToLogin('Реєстрація успішна! Тепер ви можете увійти.');
                }}
                onSwitchToLogin={() => switchToLogin()}
              />
            </Paper>
          )}

          {view === 'tripsList' && token && (
            <TripsList
              key={tripsListKey}
              token={token}
              onCreateTripRequest={() => { setAuthMessage(''); setView('createTrip');}}
              onViewDetailsRequest={(tripId) => { setAuthMessage(''); handleViewTripDetails(tripId);}}
            />
          )}

          {view === 'createTrip' && token && (
            <CreateTripForm
              token={token}
              onTripCreated={handleTripCreated}
              onCancel={() => { setAuthMessage(''); handleBackToTripsList();}}
            />
          )}

          {view === 'tripDetails' && token && selectedTripId && (
            <TripDetails
              token={token}
              tripId={selectedTripId}
              onBackToList={() => { setAuthMessage(''); handleBackToTripsList();}}
            />
          )}
        </Container>

        <Box
          component="footer"
          sx={{ py: 2, px: 2, backgroundColor: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} WanderFund
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
