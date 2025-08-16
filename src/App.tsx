// App.jsx
import { createPortal } from 'react-dom';
import Chatbot from './components/Chatbot';

export default function App() {
  return createPortal(
    <Chatbot />,
    document.body // Mounts directly to <body>
  );
}
  