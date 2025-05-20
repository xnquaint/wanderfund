import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      setLoading(false);
      setMessage(response.data.message || 'Вхід успішний!');
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        setToken(response.data.token);
        console.log('Login successful, token:', response.data.token);
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Помилка входу. Перевірте email та пароль.');
      console.error('Login error:', err.response || err.message || err);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 3,
          borderRadius: 2,
          backgroundColor: 'white',
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Вхід до WanderFund
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Електронна пошта"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Пароль"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}
          {message && !error && (
            <Alert severity="success" sx={{ width: '100%', mt: 2, mb: 1 }}>
              {message}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Увійти'}
          </Button>
          {/* <Grid container>
            <Grid item>
              <Link href="/register" variant="body2">
                {"Немає акаунту? Зареєструватися"}
              </Link>
            </Grid>
          </Grid> */}
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
