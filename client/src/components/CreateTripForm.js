import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CreateTripForm = ({ token, onTripCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [status, setStatus] = useState('planned');

  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get(`${API_URL}/currencies`);
        setCurrencies(response.data.currencies || []);
      } catch (err) {
        console.error('Failed to fetch currencies', err);
        setFormError('Не вдалося завантажити список валют.');
      }
    };
    fetchCurrencies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setFormSuccess('');

    if (!title.trim()) {
      setFormError('Назва подорожі є обов\'язковою.');
      setLoading(false);
      return;
    }
    if (!startDate) {
      setFormError('Дата початку є обов\'язковою.');
      setLoading(false);
      return;
    }
    if (!endDate) {
      setFormError('Дата завершення є обов\'язковою.');
      setLoading(false);
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError('Дата завершення не може бути раніше дати початку.');
      setLoading(false);
      return;
    }
    if (!budget.trim() || parseFloat(budget) < 0) {
        setFormError('Бюджет є обов\'язковим і не може бути від\'ємним.');
        setLoading(false);
        return;
    }
    if (!currencyId) {
        setFormError('Будь ласка, оберіть валюту.');
        setLoading(false);
        return;
    }

    const tripData = {
      title,
      description,
      startDate,
      endDate,
      budget: parseFloat(budget),
      currencyId: parseInt(currencyId, 10),
      status,
    };

    try {
      const response = await axios.post(`${API_URL}/trips`, tripData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoading(false);
      setFormSuccess('Подорож успішно створено!');
      console.log('Trip created:', response.data.trip);
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setBudget('');
      setCurrencyId('');
      setStatus('planned');
      if (onTripCreated) {
        onTripCreated(response.data.trip);
      }
    } catch (err) {
      setLoading(false);
      const errorMsg = err.response?.data?.details
        ? err.response.data.details.map(d => `${d.field || 'Помилка'}: ${d.message}`).join(', ')
        : err.response?.data?.message || 'Не вдалося створити подорож.';
      setFormError(errorMsg);
      console.error('Create trip error:', err.response || err.message || err);
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: {xs: 2, sm: 4}, mt: 2, borderRadius: 3, maxWidth: '600px', width: '100%', margin: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, textAlign: 'center', fontWeight: 'medium' }}>
        Створення нової подорожі
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Назва подорожі"
              variant="outlined"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Опис (опціонально)"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Дата початку"
              type="date"
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Дата завершення"
              type="date"
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Бюджет"
              type="number"
              variant="outlined"
              fullWidth
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={loading}
              inputProps={{ min: "0", step: "0.01" }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required disabled={loading} variant="outlined">
              <InputLabel id="currency-select-label">Валюта</InputLabel>
              <Select
                labelId="currency-select-label"
                id="currencyId"
                value={currencyId}
                label="Валюта"
                onChange={(e) => setCurrencyId(e.target.value)}
              >
                <MenuItem value="" disabled>
                  <em>Оберіть валюту</em>
                </MenuItem>
                {currencies.map((currency) => (
                  <MenuItem key={currency.id} value={currency.id}>
                    {currency.code} ({currency.name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
           <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" disabled={loading}>
              <InputLabel id="status-select-label">Статус</InputLabel>
              <Select
                labelId="status-select-label"
                value={status}
                label="Статус"
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="planned">Запланована</MenuItem>
                <MenuItem value="active">Активна</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {formError && (
          <Alert severity="error" sx={{ mt: 3, width: '100%' }}>
            {formError}
          </Alert>
        )}
        {formSuccess && (
          <Alert severity="success" sx={{ mt: 3, width: '100%' }}>
            {formSuccess}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={onCancel}
            color="inherit"
            variant="outlined"
            sx={{ mr: 1 }}
            disabled={loading}
            startIcon={<CancelIcon />}
          >
            Скасувати
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{flexGrow: 1, ml: 1}}
          >
            {loading ? 'Збереження...' : 'Зберегти подорож'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CreateTripForm;
