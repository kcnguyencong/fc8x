// Polyfill window.storage cho trình duyệt sử dụng localStorage
if (!window.storage) {
  window.storage = {
    async get(key, shared) {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    async set(key, value, shared) {
      localStorage.setItem(key, value);
      window.dispatchEvent(new CustomEvent('club-data-changed', { detail: value }));
      return true;
    }
  };
}

// Xóa sạch dữ liệu mẫu ban đầu trong localStorage
localStorage.removeItem('club-data');
