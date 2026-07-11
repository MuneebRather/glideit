const createEventSource = (endpoint) => {
  const token = localStorage.getItem('token');
  return new EventSource(`${endpoint}?token=${token}`);
};

export default createEventSource;