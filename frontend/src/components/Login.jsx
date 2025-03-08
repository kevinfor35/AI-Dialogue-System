import { useState } from 'react'
import { Box, Button, TextField, Typography, Container, Paper } from '@mui/material'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Login({ setIsAuthenticated }) {
  const navigate = useNavigate()
  const [isRegistering, setIsRegistering] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    try {
      if (isRegistering) {
        const response = await axios.post('/api/register', formData)
        setSuccessMessage(response.data.message)
        setIsRegistering(false)
      } else {
        const response = await axios.post('/api/login', formData)
        localStorage.setItem('token', response.data.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
        setIsAuthenticated(true)
        navigate('/chat')
      }
    } catch (err) {
      setError(err.response?.data?.error || (isRegistering ? '注册失败，请重试' : '登录失败，请重试'))
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering)
    setError('')
    setSuccessMessage('')
    setFormData({ username: '', password: '' })
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h5">
            {isRegistering ? '注册' : '登录'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="用户名"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="密码"
              type="password"
              id="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              value={formData.password}
              onChange={handleChange}
            />
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            {successMessage && (
              <Typography color="success" sx={{ mt: 1 }}>
                {successMessage}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
            >
              {isRegistering ? '注册' : '登录'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={toggleMode}
              sx={{ mt: 1, mb: 2 }}
            >
              {isRegistering ? '已有账号？去登录' : '没有账号？去注册'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login