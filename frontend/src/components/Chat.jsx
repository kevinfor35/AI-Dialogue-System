import { useState, useEffect } from 'react'
import { Box, TextField, Button, Paper, Typography, Container, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material'
import axios from 'axios'

function Chat() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchChatHistory()
    }
  }, [])

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get('/api/chat/history')
      setChatHistory(response.data.history)
    } catch (err) {
      setError(err.response?.data?.error || '获取聊天历史失败')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || loading) return

    setError('')
    setLoading(true)
    const currentMessage = message
    setMessage('')

    try {
      const response = await axios.post('/api/chat', { message: currentMessage })
      setChatHistory(prev => [{
        id: Date.now(),
        message: currentMessage,
        response: response.data.response,
        created_at: new Date().toISOString()
      }, ...prev])
    } catch (err) {
      setError(err.response?.data?.error || '发送消息失败，请重试')
      setMessage(currentMessage)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, minHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            AI 对话
          </Typography>
          
          <List sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
            {chatHistory.map((chat) => (
              <Box key={chat.id}>
                <ListItem>
                  <ListItemText 
                    primary={chat.message}
                    secondary="你"
                    sx={{ textAlign: 'right' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={chat.response}
                    secondary="AI"
                  />
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="输入你的消息..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{ mb: 2 }}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!message.trim() || loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? '发送中...' : '发送'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Chat