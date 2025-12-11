import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

interface ContextMenuProps {
  id: string;
  children: React.ReactNode;
  onShow?: () => void;
  onHide?: () => void;
}

export const ContextMenuTrigger: React.FC<ContextMenuProps & { children: React.ReactNode }> = ({
  id,
  children,
  onShow,
  onHide,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) {
        e.preventDefault();
        const menu = document.getElementById(id);
        if (menu) {
          menu.style.display = 'block';
          menu.style.left = `${e.clientX}px`;
          menu.style.top = `${e.clientY}px`;
          onShow?.();
        }
      }
    };

    const handleClick = () => {
      const menu = document.getElementById(id);
      if (menu) {
        menu.style.display = 'none';
        onHide?.();
      }
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('click', handleClick);
    }

    return () => {
      if (element) {
        element.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('click', handleClick);
      }
    };
  }, [id, onShow, onHide]);

  return <div ref={ref}>{children}</div>;
};

export const ContextMenu: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => {
  return (
    <div id={id} className="context-menu" style={{ display: 'none' }}>
      {children}
    </div>
  );
};

export const MenuItem: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
    const menus = document.querySelectorAll('.context-menu');
    menus.forEach((menu) => {
      (menu as HTMLElement).style.display = 'none';
    });
  };

  return (
    <div className="context-menu-item" onClick={handleClick}>
      {children}
    </div>
  );
};

