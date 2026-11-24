import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SkillTreeEditor } from './SkillTreeEditor.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SkillTreeEditor />
  </StrictMode>,
);
