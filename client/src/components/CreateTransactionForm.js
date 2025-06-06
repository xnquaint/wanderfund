import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CreateTransactionForm = ({ token, tripId, tripCurrency, onTransactionCreated, onCancel }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [currencyId, setCurrencyId] = useState('');
  const [location, setLocation] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [originalCurrencyId, setOriginalCurrencyId] = useState('');

  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showOriginalCurrencyFields, setShowOriginalCurrencyFields] = useState(false);

  useEffect(() => {
    if (description && (formError || formSuccess)) {
      setFormError('');
      setFormSuccess('');
    }
  }, [description]);

  useEffect(() => {
    if (amount && (formError || formSuccess)) {
      setFormError('');
      setFormSuccess('');
    }
  }, [amount]);


  useEffect(() => {
    const fetchData = async () => {
      if (!token && !(process.env.NODE_ENV === 'development' && API_URL.startsWith('http://localhost'))) {
        // console.warn("Token is missing for fetching categories/currencies");
      }
      try {
        const categoriesResponse = await axios.get(`${API_URL}/categories`, {
          // headers: { Authorization: `Bearer ${token}` }, 
        });
        setCategories(categoriesResponse.data.categories || []);

        const currenciesResponse = await axios.get(`${API_URL}/currencies`);
        setCurrencies(currenciesResponse.data.currencies || []);
        
        if (tripCurrency && tripCurrency.id) {
          setCurrencyId(tripCurrency.id);
        } else if (currenciesResponse.data.currencies && currenciesResponse.data.currencies.length > 0 && !currencyId) {
          // setCurrencyId(currenciesResponse.data.currencies[0].id); 
        }

      } catch (err) {
        console.error('Failed to fetch categories or currencies', err);
        setFormError('Не вдалося завантажити довідники (категорії/валюти).');
      }
    };
    fetchData();
  }, [token, tripCurrency, currencyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(''); 
    setFormSuccess(''); 

    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Сума транзакції повинна бути більшою за нуль.');
      setLoading(false);
      return;
    }
    if (!currencyId) {
      setFormError('Будь ласка, оберіть валюту транзакції.');
      setLoading(false);
      return;
    }
    if (!transactionDate) {
        setFormError('Дата транзакції є обов\'язковою.');
        setLoading(false);
        return;
    }

    const transactionData = {
      description: description.trim() || null,
      amount: parseFloat(amount),
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      transactionDate,
      currencyId: parseInt(currencyId, 10),
      location: location.trim() || null,
      originalAmount: originalAmount ? parseFloat(originalAmount) : null,
      originalCurrencyId: originalCurrencyId ? parseInt(originalCurrencyId, 10) : null,
    };

    try {
      const response = await axios.post(`${API_URL}/trips/${tripId}/transactions`, transactionData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoading(false);
      setFormSuccess(`Транзакцію "${response.data.transaction.description || 'Без опису'}" успішно додано!`);
      
      setDescription('');
      setAmount('');
      setCategoryId('');
      setLocation('');
      setOriginalAmount('');
      setOriginalCurrencyId('');
      setShowOriginalCurrencyFields(false);
      if (tripCurrency && tripCurrency.id) setCurrencyId(tripCurrency.id);

      if (onTransactionCreated) {
        onTransactionCreated(response.data.transaction);
      }
    } catch (err) {
      setLoading(false);
      const errorMsg = err.response?.data?.details
        ? err.response.data.details.map(d => `${d.field || 'Помилка'}: ${d.message}`).join(', ')
        : err.response?.data?.message || 'Не вдалося додати транзакцію.';
      setFormError(errorMsg);
      console.error('Create transaction error:', err.response || err.message || err);
    }
  };

  const handleCancel = () => {
    setFormError('');
    setFormSuccess('');
    onCancel();
  };

  return (
    <Paper elevation={6} sx={{ padding: {xs: 2, sm: 3}, mt: 3, mb:3, borderRadius: 3, maxWidth: '700px', width: '100%', margin: 'auto' }}>
      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'medium' }}>
          Додати нову транзакцію
        </Typography>
        <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
        </IconButton>
      </Box>
      <Box component="form" onSubmit={handleSubmit} noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <TextField
          label="Опис транзакції"
          variant="outlined"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          helperText="Наприклад: Обід в кафе, Квиток на метро, Сувенір"
        />
        
        <TextField 
          label="Сума"
          type="number"
          variant="outlined"
          fullWidth
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          inputProps={{ min: "0.01", step: "0.01" }}
        />
        
        <FormControl fullWidth required disabled={loading} variant="outlined">
          <InputLabel id="transaction-currency-select-label">Валюта суми</InputLabel>
          <Select
            labelId="transaction-currency-select-label"
            value={currencyId}
            label="Валюта суми"
            onChange={(e) => setCurrencyId(e.target.value)}
          >
            {currencies.map((currency) => (
              <MenuItem key={currency.id} value={currency.id}>
                {currency.code} ({currency.name})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button 
            size="small" 
            onClick={() => setShowOriginalCurrencyFields(!showOriginalCurrencyFields)}
            sx={{textTransform: 'none', alignSelf: 'flex-start'}}
        >
          {showOriginalCurrencyFields ? 'Приховати оригінальну суму/валюту' : '+ Вказати оригінальну суму/валюту (для конвертації)'}
        </Button>

        {showOriginalCurrencyFields && (
          <>
            <TextField
              label="Оригінальна сума"
              type="number"
              variant="outlined"
              fullWidth
              value={originalAmount}
              onChange={(e) => setOriginalAmount(e.target.value)}
              disabled={loading}
              inputProps={{ min: "0.01", step: "0.01" }}
            />
            <FormControl fullWidth disabled={loading} variant="outlined">
              <InputLabel id="original-currency-select-label">Оригінальна валюта</InputLabel>
              <Select
                labelId="original-currency-select-label"
                value={originalCurrencyId}
                label="Оригінальна валюта"
                onChange={(e) => setOriginalCurrencyId(e.target.value)}
              >
                 <MenuItem value=""><em>Не вказано</em></MenuItem>
                {currencies.map((currency) => (
                  <MenuItem key={`orig-${currency.id}`} value={currency.id}>
                    {currency.code} ({currency.name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
        
        <FormControl fullWidth variant="outlined" disabled={loading}>
          <InputLabel id="category-select-label-trans">Категорія (опціонально)</InputLabel>
          <Select
            labelId="category-select-label-trans"
            value={categoryId}
            label="Категорія (опціонально)"
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <MenuItem value="">
              <em>Автоматично / Не вказано</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="Дата транзакції"
          type="date"
          variant="outlined"
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          disabled={loading}
        />
        
        <TextField
          label="Місцезнаходження (опціонально)"
          variant="outlined"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={loading}
        />

        {formError && (
          <Alert severity="error" sx={{ mt: 1, width: '100%' }} onClose={() => setFormError('')}> {/* Додано onClose */}
            {formError}
          </Alert>
        )}
        {formSuccess && (
          <Alert severity="success" sx={{ mt: 1, width: '100%' }} onClose={() => setFormSuccess('')}> {/* Додано onClose */}
            {formSuccess}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            onClick={handleCancel}
            color="inherit"
            variant="text"
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Закрити
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
          >
            {loading ? 'Додавання...' : 'Додати транзакцію'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CreateTransactionForm;
