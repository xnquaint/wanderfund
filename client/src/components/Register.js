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
  Grid,
  Link, 
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Register = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Паролі не співпадають.');
      return;
    }
    if (password.length < 8) {
        setError('Пароль повинен містити щонайменше 8 символів.');
        return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        firstName,
        lastName,
      });
      setLoading(false);
      setMessage(response.data.message || 'Реєстрація успішна! Тепер ви можете увійти.');
      console.log('Registration successful:', response.data);
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
      setEmail(''); setPassword(''); setConfirmPassword(''); setFirstName(''); setLastName('');

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Помилка реєстрації. Спробуйте інший email.');
      console.error('Registration error:', err.response || err.message || err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="firstName"
        label="Ім'я"
        name="firstName"
        autoComplete="given-name"
        autoFocus
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        disabled={loading}
        variant="outlined"
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="lastName"
        label="Прізвище"
        name="lastName"
        autoComplete="family-name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        disabled={loading}
        variant="outlined"
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="email-register"
        label="Електронна пошта"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        variant="outlined"
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password-register"
        label="Пароль (мін. 8 символів)"
        type="password"
        id="password-register"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        variant="outlined"
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Підтвердіть пароль"
        type="password"
        id="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        variant="outlined"
      />
      {error && (
        <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1, borderRadius: 1 }}>
          {error}
        </Alert>
      )}
      {message && !error && (
        <Alert severity="success" sx={{ width: '100%', mt: 2, mb: 1, borderRadius: 1 }}>
          {message}
        </Alert>
      )}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={26} color="inherit" /> : 'Зареєструватися'}
      </Button>
      <Grid container justifyContent="flex-end">
        <Grid item>
          <Link href="#" variant="body2" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
            Вже є акаунт? Увійти
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Register;
