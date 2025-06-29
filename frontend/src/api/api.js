export const chatAPI = {
  getChats: () => axios.get('/chat', { withCredentials: true }),
  getMessages: (chatId) => axios.get(`/chat/message/${chatId}`, { withCredentials: true }),
  sendMessage: (content, chatId) => axios.post('/chat/message', { content, chatId }, { withCredentials: true }),
  startChat: (userId) => axios.post('/chat', { userId }, { withCredentials: true }),
};