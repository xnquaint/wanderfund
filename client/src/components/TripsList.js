import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const TripsList = ({ token, onCreateTripRequest, onViewDetailsRequest }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(response.data.trips || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Не вдалося завантажити подорожі.');
      console.error('Fetch trips error:', err.response || err.message || err);
    } finally {
      setLoading(false);
    }
  }, [token]); 

  useEffect(() => {
    if (token) {
      fetchTrips();
    }
  }, [token, fetchTrips]);

  const handleDeleteTrip = async (tripId) => {
    const tripToDelete = trips.find(trip => trip.id === tripId);
    const confirmationMessage = tripToDelete
      ? `Ви впевнені, що хочете видалити подорож "${tripToDelete.title}" та всі пов'язані з нею транзакції?`
      : 'Ви впевнені, що хочете видалити цю подорож?';

    if (window.confirm(confirmationMessage)) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchTrips();
      } catch (err) {
        setError(err.response?.data?.message || 'Не вдалося видалити подорож.');
        console.error('Delete trip error:', err.response || err.message || err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && trips.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4, height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{fontWeight: 'bold'}}>
          Мої подорожі
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onCreateTripRequest}
        >
          Створити подорож
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {trips.length === 0 && !loading && (
        <Paper sx={{p: {xs: 2, sm: 4}, textAlign: 'center', mt: 4, borderRadius: 3, boxShadow: 1}}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
            У вас ще немає запланованих подорожей.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{mb:2}}>
            Почніть планувати свої пригоди вже зараз!
            </Typography>
            <Button variant="outlined" color="primary" onClick={onCreateTripRequest} startIcon={<AddCircleOutlineIcon />}>
                Створити першу подорож
            </Button>
        </Paper>
      )}

      <Grid container spacing={3}>
        {trips.map((trip) => (
          <Grid item xs={12} sm={6} md={4} key={trip.id}>
            <Card sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                borderRadius: 3, // Збільшено borderRadius
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
                transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    transform: 'translateY(-4px)'
                } 
            }}>
              <CardContent 
                sx={{ flexGrow: 1, cursor: 'pointer', p: 2.5 }} 
                onClick={() => onViewDetailsRequest(trip.id)}
              >
                <Typography gutterBottom variant="h5" component="h2" color="primary.dark" sx={{fontWeight: 'bold'}}>
                  {trip.title}
                </Typography>
                <Chip 
                    label={trip.status ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1) : 'Невідомий'}
                    color={trip.status === 'planned' ? 'info' : trip.status === 'active' ? 'success' : 'default'} 
                    size="small" 
                    sx={{mb: 1.5, fontWeight: 'medium', borderRadius: '6px'}}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '40px', 
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {trip.description || 'Опис відсутній.'}
                </Typography>
                <Box>
                    <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                    <strong>Дати:</strong> {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" sx={{fontWeight: 'bold', color: 'primary.main', mt: 0.5}}>
                    Бюджет: {trip.budget} {trip.currency?.code || ''}
                    </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{justifyContent: 'flex-end', p:1.5, borderTop: (theme) => `1px solid ${theme.palette.divider}`}}>
                <Tooltip title="Переглянути деталі">
                    <IconButton size="medium" color="primary" onClick={() => onViewDetailsRequest(trip.id)}>
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
                {/* <Tooltip title="Редагувати подорож">
                    <IconButton size="medium" color="default" onClick={() => alert(`Редагування ${trip.id} (не реалізовано)`)}>
                        <EditIcon />
                    </IconButton>
                </Tooltip> */}
                <Tooltip title="Видалити подорож">
                    <IconButton size="medium" sx={{color: 'error.light', '&:hover': {color: 'error.main'}}} onClick={() => handleDeleteTrip(trip.id)}>
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {loading && trips.length > 0 &&
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <CircularProgress />
        </Box>
      }
    </Container>
  );
};

export default TripsList;
