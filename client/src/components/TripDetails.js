import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Collapse,
  Card,
  CardContent,
  TextField,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCardIcon from '@mui/icons-material/AddCard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import FilterListIcon from '@mui/icons-material/FilterList';
import CreateTransactionForm from './CreateTransactionForm';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const PREDEFINED_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#FF4560', '#775DD0', '#00E396', '#FEB019', '#FF66C3',
  '#546E7A', '#D4526E', '#2E294E', '#F86624', '#F9C80E',
  '#662E9B', '#43BCCD', '#EA3546', '#F07B3F', '#FFD43B'
];
let colorIndex = 0;
const getNextColor = () => {
  const color = PREDEFINED_COLORS[colorIndex % PREDEFINED_COLORS.length];
  colorIndex++;
  return color;
};

const TripDetails = ({ token, tripId, onBackToList }) => {
  const [trip, setTrip] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTransactionForm, setShowAddTransactionForm] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const fetchAllData = useCallback(async () => {
    if (!tripId || !token) return;
    setLoading(true);
    setError('');
    setForecastData(null);
    setForecastError('');
    try {
      const [tripResponse, transactionsResponse, forecastResponse, categoriesResponse] = await Promise.all([
        axios.get(`${API_URL}/trips/${tripId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/trips/${tripId}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/trips/${tripId}/forecast`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/categories`)
      ]);
      
      setTrip(tripResponse.data.trip);
      setEditableTitle(tripResponse.data.trip?.title || '');
      setAllTransactions(transactionsResponse.data.transactions || []);
      setForecastData(forecastResponse.data.forecast);
      setCategories(categoriesResponse.data.categories || []);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Не вдалося завантажити дані подорожі.';
      setError(errMsg);
      console.error('Fetch trip data error:', err.response || err.message || err);
    } finally {
      setLoading(false);
    }
  }, [token, tripId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleTransactionCreated = (newTransaction) => {
    fetchAllData(); 
    setShowAddTransactionForm(false);
  };

  const handleFetchForecast = async () => {
    if (!tripId || !token) return;
    setLoadingForecast(true);
    setForecastError('');
    try {
      const response = await axios.get(`${API_URL}/trips/${tripId}/forecast`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForecastData(response.data.forecast);
    } catch (err) {
      setForecastError(err.response?.data?.message || 'Не вдалося завантажити прогноз.');
      console.error('Fetch forecast error:', err.response || err.message || err);
    } finally {
      setLoadingForecast(false);
    }
  };
  
  const handleTitleEditToggle = () => {
    if (isEditingTitle && trip && editableTitle.trim() && editableTitle !== trip.title) {
        handleSaveTitle();
    } else if (trip) {
        setEditableTitle(trip.title); 
        setIsEditingTitle(!isEditingTitle); 
    } else {
        setIsEditingTitle(!isEditingTitle); 
    }
  };

  const handleSaveTitle = async () => {
    if (!trip || !editableTitle.trim()) {
        setIsEditingTitle(false);
        if(trip) setEditableTitle(trip.title);
        return;
    }
    if (editableTitle === trip.title) {
        setIsEditingTitle(false);
        return;
    }
    try {
        const response = await axios.put(`${API_URL}/trips/${trip.id}`, 
            { title: editableTitle },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setTrip(response.data.trip);
        setEditableTitle(response.data.trip.title);
        setIsEditingTitle(false);
    } catch (err) {
        console.error("Failed to update trip title", err);
        setError(err.response?.data?.message || "Не вдалося оновити назву подорожі.");
        if(trip) setEditableTitle(trip.title); 
        setIsEditingTitle(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!selectedCategoryId) {
      return allTransactions;
    }
    return allTransactions.filter(t => t.category?.id === parseInt(selectedCategoryId));
  }, [allTransactions, selectedCategoryId]);

  const categorySpendingData = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return [];
    }
    const spendingMap = new Map();
    filteredTransactions.forEach(transaction => {
      if (parseFloat(transaction.amount) > 0) {
        const categoryName = transaction.category?.name || 'Без категорії';
        const currentSum = spendingMap.get(categoryName) || 0;
        spendingMap.set(categoryName, currentSum + parseFloat(transaction.amount));
      }
    });
    return Array.from(spendingMap, ([name, value]) => ({ name, value }))
                           .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const chartColors = useMemo(() => {
    colorIndex = 0;
    return categorySpendingData.map(() => getNextColor());
  }, [categorySpendingData]);

  if (loading && !trip) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4, height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !trip) {
    return (
      <Container maxWidth="md" sx={{mt: 2}}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBackToList} sx={{ mb: 2 }} variant="outlined">
            До списку подорожей
        </Button>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container maxWidth="md" sx={{mt: 2}}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBackToList} sx={{ mb: 2 }} variant="outlined">
            До списку подорожей
        </Button>
        <Typography variant="h6" align="center">Завантаження даних подорожі...</Typography>
      </Container>
    );
  }

  const totalSpentOverall = allTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const remainingBudgetOverall = parseFloat(trip.budget) - totalSpentOverall;
  const totalSpentOnFiltered = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);


  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBackToList} sx={{ mb: 2 }} variant="outlined">
        До списку подорожей
      </Button>

      <Paper elevation={3} sx={{ p: {xs: 2, sm:3}, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
            {isEditingTitle ? (
                <TextField
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    variant="standard"
                    fullWidth
                    autoFocus
                    onBlur={handleSaveTitle}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTitle(); } }}
                    sx={{ '& .MuiInput-input': { typography: 'h4', fontWeight: 'bold', color: 'primary.dark' }, mr:1, flexGrow: 1 }}
                />
            ) : (
                <Typography variant="h4" component="h1" color="primary.dark" sx={{fontWeight: 'bold', flexGrow: 1, mr:1}}>
                {trip.title}
                </Typography>
            )}
            <Tooltip title={isEditingTitle ? "Зберегти назву" : "Редагувати назву"}>
                <IconButton onClick={handleTitleEditToggle} size="small">
                    {isEditingTitle ? <SaveIcon color="primary" /> : <EditIcon />}
                </IconButton>
            </Tooltip>
        </Box>
        <Chip
            label={trip.status ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1) : 'Невідомий'}
            color={trip.status === 'planned' ? 'info' : trip.status === 'active' ? 'success' : 'default'}
            size="medium"
            sx={{mb: 2, fontWeight: 'medium', fontSize: '0.9rem'}}
        />
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {trip.description || 'Опис відсутній.'}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><Typography variant="subtitle1"><strong>Дати:</strong> {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography variant="subtitle1"><strong>Бюджет:</strong> {trip.budget} {trip.currency?.code}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography variant="subtitle1"><strong>Витрачено (всього):</strong> {totalSpentOverall.toFixed(2)} {trip.currency?.code}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography variant="subtitle1" sx={{color: remainingBudgetOverall < 0 ? 'error.main' : 'success.main', fontWeight: 'bold'}}><strong>Залишок (загальний):</strong> {remainingBudgetOverall.toFixed(2)} {trip.currency?.code}</Typography></Grid>
        </Grid>
      </Paper>

      {/* Секція для прогнозу */}
      <Box sx={{ mb: 3 }}>
        {(trip.status === 'planned' || trip.status === 'active') && (
            <Button variant="outlined" color="secondary" size="small" startIcon={<AssessmentIcon />} onClick={handleFetchForecast} disabled={loadingForecast} sx={{mb: 2, display: 'inline-flex'}}>
            {loadingForecast ? 'Оновлення прогнозу...' : 'Оновити Прогноз'}
            </Button>
        )}
        {forecastError && <Alert severity="error" sx={{mb:2}}>{forecastError}</Alert>}
        {forecastData && !loading && (
          <Card variant="outlined" sx={{borderRadius: 2, borderColor: 'grey.300', mt: 1, mb:3}}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.primary" sx={{fontWeight: 'medium'}}>
                Прогноз для "{forecastData.tripTitle}"
              </Typography>
              {forecastData.message && (trip.status === 'completed' || trip.status === 'cancelled' || forecastData.tripStatus === 'ended_by_date') ? (
                <Alert severity="info">{forecastData.message}</Alert>
              ) : (
                <Grid container spacing={1.5} sx={{mt: 1}}>
                  <Grid item xs={12} md={6}>
                    <Typography><strong>Загальний бюджет:</strong> {forecastData.budget.toFixed(2)} {forecastData.currency?.code}</Typography>
                    <Typography><strong>Вже витрачено:</strong> {forecastData.totalSpent.toFixed(2)} {forecastData.currency?.code}</Typography>
                    <Typography sx={{fontWeight: 'bold', color: forecastData.remainingBudget < 0 ? 'error.main' : 'success.main'}}>
                        <strong>Поточний залишок:</strong> {forecastData.remainingBudget.toFixed(2)} {forecastData.currency?.code}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography><strong>Днів пройшло / Загалом:</strong> {forecastData.daysPassed} / {forecastData.totalTripDays}</Typography>
                    <Typography><strong>Днів залишилося:</strong> {forecastData.daysRemaining}</Typography>
                    <Typography>
                        <strong>{forecastData.daysPassed > 0 ? 'Фактичні середньоденні витрати:' : 'Планові середньоденні витрати:'}</strong> {forecastData.averageDailySpending.toFixed(2)} {forecastData.currency?.code}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sx={{mt:1}}>
                    <Typography sx={{fontWeight: 'bold', fontSize: '1.1rem'}}>
                        Прогнозований баланс на кінець подорожі: 
                        <Box component="span" sx={{color: forecastData.projectedEndOfTripBalance < 0 ? 'error.dark' : 'success.dark', ml:1, fontWeight:'bold'}}>
                            {forecastData.projectedEndOfTripBalance.toFixed(2)} {forecastData.currency?.code}
                        </Box>
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Alert 
                        severity={forecastData.projectedEndOfTripBalance < 0 && forecastData.daysRemaining > 0 ? "warning" : (forecastData.remainingBudget < 0 && forecastData.daysRemaining <=0 ? "error" : "info")} 
                        sx={{mt:1.5, '& .MuiAlert-message': {width: '100%'}}}
                    >
                        {forecastData.advice}
                    </Alert>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        {(trip.status === 'planned' || trip.status === 'active') && (
            <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddCardIcon />}
                onClick={() => setShowAddTransactionForm(!showAddTransactionForm)}
                sx={{mb: showAddTransactionForm ? 2 : 0}}
            >
            {showAddTransactionForm ? 'Приховати форму транзакції' : 'Додати нову транзакцію'}
            </Button>
        )}
        <Collapse in={showAddTransactionForm}>
          <CreateTransactionForm
            token={token}
            tripId={tripId}
            tripCurrency={trip.currency}
            onTransactionCreated={handleTransactionCreated}
            onCancel={() => setShowAddTransactionForm(false)}
          />
        </Collapse>
      </Box>
      
      {error && allTransactions.length === 0 && !loading && (
         <Alert severity="warning" sx={{ mb: 2 }}>{error.includes("транзакції") ? error : "Помилка завантаження транзакцій."}</Alert>
      )}

      <Typography variant="h5" component="h2" gutterBottom sx={{mt:3}}>
        Список транзакцій
        {filteredTransactions.length > 0 && ` (Витрачено по фільтру: ${totalSpentOnFiltered.toFixed(2)} ${trip.currency?.code})`}
      </Typography>

      <FormControl fullWidth variant="outlined" sx={{ mb: 2, maxWidth: {xs: '100%', sm: '300px'} }}>
        <InputLabel id="filter-category-label">Фільтрувати за категорією</InputLabel>
        <Select
          labelId="filter-category-label"
          value={selectedCategoryId}
          label="Фільтрувати за категорією"
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          startAdornment={<FilterListIcon sx={{mr:1, color: 'action.active'}} />}
        >
          <MenuItem value="">
            <em>Всі категорії</em>
          </MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {filteredTransactions.length === 0 && !loading && (
        <Typography color="text.secondary" sx={{mt: 1, textAlign: 'center', py: 3}}>
            {selectedCategoryId ? 'Немає транзакцій для обраної категорії.' : 'Для цієї подорожі ще немає транзакцій.'}
        </Typography>
      )}
      {filteredTransactions.length > 0 && (
        <Paper elevation={0} sx={{borderRadius: 2, border: '1px solid #eee', overflow: 'hidden'}}>
        <List sx={{ backgroundColor: 'background.paper', borderRadius: 2, p:0 }}>
          {filteredTransactions.map((transaction, index) => (
            <React.Fragment key={transaction.id}>
              <ListItem 
                alignItems="flex-start"
                secondaryAction={
                  <Box sx={{textAlign: 'right'}}>
                     <Typography
                        variant="body1"
                        sx={{ fontWeight: 'bold', color: parseFloat(transaction.amount) < 0 ? 'success.main' : 'text.primary' }}
                      >
                        {parseFloat(transaction.amount) < 0 ? '' : ''}{transaction.amount} {transaction.currency?.code}
                      </Typography>
                      {transaction.originalAmount && transaction.originalCurrency && transaction.currencyId !== transaction.originalCurrencyId && (
                        <Typography variant="caption" color="text.secondary">
                            (було {transaction.originalAmount} {transaction.originalCurrency?.code})
                        </Typography>
                      )}
                  </Box>
                }
                sx={{py: 1.5, px:2}}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{fontWeight: 500, mb:0.5}}>{transaction.description || 'Без опису'}</Typography>}
                  secondary={
                    <>
                      <Chip 
                        label={transaction.category ? transaction.category.name : 'Без категорії'} 
                        size="small" 
                        variant="outlined" 
                        color={transaction.category ? "default" : "warning"}
                        sx={{mr: 1, mb: 0.5, borderRadius: '6px', fontSize: '0.75rem', height: '20px', lineHeight: '16px'}} 
                      />
                      <Typography component="span" variant="caption" display="block" color="text.secondary">
                        {new Date(transaction.transactionDate).toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {transaction.location ? `  •  ${transaction.location}` : ''}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < filteredTransactions.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
        </Paper>
      )}

      {filteredTransactions.length > 0 && categorySpendingData.length > 0 && (
        <Paper elevation={3} sx={{ p: {xs: 2, sm:3}, borderRadius: 3, mb: 3, mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{textAlign: 'center', fontWeight: 'medium'}}>
            Аналіз витрат {selectedCategoryId ? `для категорії "${categories.find(c=>c.id === parseInt(selectedCategoryId))?.name || ''}"` : 'за категоріями'}
          </Typography>
          <Box sx={{ width: '100%', height: {xs: 300, sm: 350, md: 400} }}>
            <ResponsiveContainer>
              <PieChart margin={{ top: 5, right: 20, bottom: 30, left: 20 }}>
                <Pie
                  data={categorySpendingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius="75%"
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categorySpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value.toFixed(2)} ${trip.currency?.code || ''}`]}/>
                <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: 20}}/>
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
      {filteredTransactions.length > 0 && categorySpendingData.length === 0 && !loading && (
         <Typography color="text.secondary" align="center" sx={{py:2, mt: 2}}>Немає даних для відображення графіка (можливо, всі транзакції з нульовою сумою або без категорій).</Typography>
      )}
    </Container>
  );
};

export default TripDetails;
