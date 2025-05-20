import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { UserContext } from '../../context/UserContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { teamSvg, mapSvg, notiSvg, chatSvg, exitSvg, profileSvg, loginSvg } from './svg';
import { useApi } from '../../hooks/useApi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://nekokoneko.org/backend';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://nekokoneko.org/ws/';

export const Header = () => {
  const { apiFetch } = useApi();
  const location = useLocation();
  const { token, setToken, hasTeam } = useContext(UserContext);

  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifs, setOpenNotifs] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const [avatar, setAvatar] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [nombre, setNombre] = useState('');
  const [emailUser, setEmailUser] = useState('');
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const wsRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const mobileRef = useRef(null);

  const navigate = useNavigate();

  const currentUserId = useMemo(() => {
    if (!token) return null;
    try {
      const p = jwtDecode(token);
      return p.id || p.userId || p.sub;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    const handleClick = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpenNotifs(false);
      }
      if (
        mobileRef.current &&
        !mobileRef.current.contains(e.target) &&
        !e.target.closest('#mobile-menu-button')
      ) {
        setOpenMobile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!token) {
      setAvatar(null);
      setNombre('');
      setEmailUser('');
      return;
    }
    setLoadingAvatar(true);
    apiFetch(`/api/auth/my/`)
      .then(r => {
        if (!r.ok) throw r;
        return r.json();
      })
      .then(data => {
        setAvatar(API_BASE_URL + data.avatar);
        setNombre(data.nombre);
        setEmailUser(data.email);
        setAdmin(data.rol === 'admin');
      })
      .catch(console.error)
      .finally(() => setLoadingAvatar(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    apiFetch(`/api/notifications`)
      .then(r => (r.ok ? r.json() : []))
      .then(setNotifications)
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!currentUserId || !token) return;
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribeNotif' }));
    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'initNotifs') {
          setNotifications(msg.notifications);
        } else if (msg.type === 'notification') {
          setNotifications(n => [msg.notification, ...n]);
        }
      } catch {}
    };
    ws.onerror = console.error;
    return () => ws.close();
  }, [currentUserId, token]);

  useEffect(() => {
    if (openNotifs === false) {
      notifications
        .filter(n => !n.leida)
        .forEach(n => {
          apiFetch(`/api/notifications/${n._id}/read`, {
            method: 'PATCH',
          }).catch(console.error);
        });
      setNotifications(n => n.map(x => ({ ...x, leida: true })));
    }
  }, [openNotifs]);

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token2');
    setOpenProfile(false);
    setOpenMobile(false);
    navigate('/login');
  };

  const openHandler = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setOpenNotifs(prev => {
      const opening = !prev;
      if (opening) {
        apiFetch(`/api/notifications`)
          .then(r => (r.ok ? r.json() : []))
          .then(fresh => setNotifications(fresh))
          .catch(console.error);
      }
      return opening;
    });
  };

  const unread = notifications.filter(n => !n.leida).length;
  const badge = unread === 0 ? null : unread > 9 ? '+9' : unread;

  const navItems = [
<<<<<<< Updated upstream
    { to: '/', label: 'Inicio', show: true },
    { to: '/users', label: 'Usuarios', show: !!token },
    { to: '/teams', label: 'Equipos', show: true },
    { to: '/games', label: 'Partidos', show: !!token },
    { to: '/torneos', label: 'Torneos', show: !!token },
    { to: 'http://localhost:3000', label: 'Backoffice', show: admin },
    { to: '/map', label: mapSvg, show: !!token },
    { to: '/chats', label: chatSvg, show: !!token },
=======
    { to: '/',           label: 'Inicio',    show: true },
    { to: '/users',      label: 'Usuarios',  show: !!token },
    { to: '/games',      label: 'Partidos',  show: !!token },
    { to: '/teams',      label: 'Equipos',   show: true },
    { to: '/torneos',    label: 'Torneos',   show: !!token },
    { to: 'http://nekokoneko.org/backend',  label: 'Backoffice', show: admin },
    { to: '/chats',      label: chatSvg,     show: !!token },
>>>>>>> Stashed changes
    {
      to: hasTeam ? '/teams/my' : '/teams/new',
      label: teamSvg,
      show: !!token,
    },
    {
      key: 'notifs',
      onClick: openHandler,
      label: notiSvg,
      badge,
      show: !!token,
    },
  ];

  const leftNavItems = navItems.filter(
    i =>
      i.show &&
      !['/teams/my', '/teams/new', '/map', '/chats'].includes(i.to) &&
      i.key !== 'notifs'
  );
  const rightNavItems = navItems.filter(
    i =>
      i.show &&
      (['/teams/my', '/teams/new', '/map', '/chats'].includes(i.to) ||
        i.key === 'notifs')
  );

  const iconItems = navItems.filter(
    i =>
      i.show &&
      (i.key === 'notifs' ||
        i.to === '/map' ||
        i.to === '/chats' ||
        i.to === (hasTeam ? '/teams/my' : '/teams/new'))
  );

  return (
    <header className="relative flex items-center justify-between p-4 mt-2 text-gray-700 z-1000 bg-white">
      <div className="flex items-center ml-6 space-x-8">
        <p className="text-4xl font-bold font-calsans">TACTIX</p>
        <div className="hidden md:flex space-x-6">
          {leftNavItems.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`text-2xl font-semibold pb-1 transition-colors ${
                  active
                    ? 'border-b-3 border-[#ffc31f] text-[#f0b921]'
                    : 'hover:text-gray-500'
                }`}
              >
                {label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {token ? (
        <div className="hidden md:flex items-center mr-10 space-x-5">
          {rightNavItems.map(item => {
            if (item.to) {
              const active = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`text-2xl font-semibold pb-1 transition-colors ${
                    active
                      ? 'border-b-3 border-[#ffc31f] text-[#f0b921]'
                      : 'hover:text-gray-500'
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            }
            return (
              <div key={item.key} ref={notifRef} className="relative">
                <button onClick={item.onClick} className="cursor-pointer">
                  {item.label()}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
                {openNotifs && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-50 rounded-lg z-50 p-2 space-y-1 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-gray-500">Sin notificaciones</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => n.url && navigate(n.url)}
                          className={`px-3 py-2 rounded-lg border ${
                            n.leida
                              ? 'bg-white border-gray-300 text-gray-700'
                              : 'bg-blue-100 border-blue-300 text-gray-900 font-semibold shadow-md'
                          }${n.url ? ' cursor-pointer hover:bg-gray-100 transition' : ''}`}
                        >
                          <p className="truncate font-semibold text-gray-800">{n.titulo}</p>
                          <p className="text-sm truncate mt-1">{n.contenido}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(n.fecha).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div ref={profileRef} className="relative">
            {loadingAvatar ? (
              <div className="w-10 h-10 rounded-full bg-[#0057D9] animate-pulse" />
            ) : (
              <img
                src={avatar || 'https://placehold.co/100'}
                alt="avatar"
                onClick={() => setOpenProfile(o => !o)}
                className="w-10 h-10 ml-5 rounded-full cursor-pointer"
              />
            )}
            {openProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-100 rounded-md z-9999">
                <div className="flex items-center px-4 py-3 border-b border-gray-300">
                  <img
                    src={avatar || 'https://placehold.co/100'}
                    alt="avatar"
                    className="w-13 h-13 rounded-full"
                  />
                  <div className="ml-3">
                    <p className="text-lg font-semibold">{nombre}</p>
                    <p className="text-xs text-gray-600 truncate">{emailUser}</p>
                  </div>
                </div>
                <div className="mt-1 flex items-center px-4 hover:bg-gray-200 transition cursor-pointer">
                  {profileSvg()}
                  <NavLink
                    to="/profile"
                    onClick={() => setOpenProfile(false)}
                    className="block px-2 py-2 text-gray-800 text-md"
                  >
                    Ver Perfil
                  </NavLink>
                </div>
                <div className="flex items-center px-5 hover:bg-gray-200 transition cursor-pointer mb-2">
                  {exitSvg()}
                  <button
                    onClick={logout}
                    className="w-full text-left px-2 py-2 text-[#ad3434] hover:bg-gray-200 transition text-md cursor-pointer"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <NavLink
          to="/login"
          className="hidden md:flex items-center mr-6 border-2 border-gray-700 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium transition gap-1"
        >
          {loginSvg()}
          Iniciar sesión
        </NavLink>
      )}

      <button
        id="mobile-menu-button"
        onClick={() => setOpenMobile(v => !v)}
        className="md:hidden p-2 mr-4 focus:outline-none"
      >
        {openMobile ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
          </svg>
        )}
      </button>

      {openMobile && (
        <div
          ref={mobileRef}
          className="absolute top-full left-0 w-full bg-white z-40 md:hidden"
        >
          <nav className="flex flex-col p-4 space-y-2">
          
            {navItems
              .filter(i => i.show)
              .map(item => {
                const isIcon =
                  item.key === 'notifs' ||
                  item.to === '/map' ||
                  item.to === '/chats' ||
                  item.to === (hasTeam ? '/teams/my' : '/teams/new');
                if (isIcon) return null;

                if (item.to === '/torneos') {
                  const active = location.pathname === item.to;
                  return (
                    <React.Fragment key="torneos-with-icons">
                      <NavLink
                        to={item.to}
                        onClick={() => setOpenMobile(false)}
                        className={`text-xl font-semibold py-2 transition-colors ${
                          active ? 'text-gray-500' : 'hover:text-gray-500'
                        }`}
                      >
                        {item.label}
                      </NavLink>

                      <div key="icons-row" className="flex justify-around mt-2 mb-4">
                        {iconItems.map(iconItem => {
                          if (iconItem.to) {
                            const isActive = location.pathname === iconItem.to;
                            return (
                              <NavLink
                                key={iconItem.to}
                                to={iconItem.to}
                                onClick={() => setOpenMobile(false)}
                                className={`p-2 rounded-lg transition ${
                                  isActive ? 'bg-gray-200' : 'hover:bg-gray-100'
                                }`}
                              >
                                {iconItem.label}
                              </NavLink>
                            );
                          }
                          return (
                            <div key={iconItem.key} ref={notifRef} className="relative">
                              <button
                                onClick={iconItem.onClick}
                                className="p-2 rounded-lg hover:bg-gray-100 transition"
                              >
                                {iconItem.label()}
                                {iconItem.badge && (
                                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                                    {iconItem.badge}
                                  </span>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {openNotifs && (
                        <div className="w-full bg-gray-50 rounded-lg z-50 p-2 space-y-1 max-h-64 overflow-y-auto mb-4">
                          {notifications.length === 0 ? (
                            <p className="p-4 text-center text-gray-500">Sin notificaciones</p>
                          ) : (
                            notifications.map(n => (
                              <div
                                key={n._id}
                                onClick={() => {
                                  if (n.url) {
                                    navigate(n.url);
                                    setOpenMobile(false);
                                    setOpenNotifs(false);
                                  }
                                }}
                                className={`px-3 py-2 rounded-lg border ${
                                  n.leida
                                    ? 'bg-white border-gray-300 text-gray-700'
                                    : 'bg-blue-100 border-blue-300 text-gray-900 font-semibold shadow-md'
                                }${n.url ? ' cursor-pointer hover:bg-gray-100 transition' : ''}`}
                              >
                                <p className="truncate font-semibold text-gray-800">{n.titulo}</p>
                                <p className="text-sm truncate mt-1">{n.contenido}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(n.fecha).toLocaleString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                }

                return (
                  <NavLink
                    key={item.to || item.key}
                    to={item.to}
                    onClick={() => setOpenMobile(false)}
                    className="text-xl font-semibold py-2"
                  >
                    {item.label}
                  </NavLink>
                );
              })}

            {token ? (
              <div className="mt-4 pt-2 border-t border-gray-300">
                <div className="flex items-center space-x-3 mb-6 mt-3">
                  <img
                    src={avatar || 'https://via.placeholder.com/40'}
                    alt="avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{nombre}</p>
                    <p className="text-sm text-gray-600 truncate">{emailUser}</p>
                  </div>
                </div>
                <NavLink
                  to="/profile"
                  onClick={() => setOpenMobile(false)}
                  className="flex gap-3 items-center mb-4 text-lg font-medium"
                >
                  {profileSvg()}
                  <span>Ver Perfil</span>
                </NavLink>
                <button
                  onClick={() => {
                    logout();
                    setOpenMobile(false);
                  }}
                  className="flex items-center text-lg font-medium text-[#ad3434]"
                >
                  {exitSvg()}
                  <span className="ml-2">Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setOpenMobile(false)}
                className="flex items-center mt-4 text-lg font-medium"
              >
                {loginSvg()}
                <span className="ml-2">Iniciar Sesión</span>
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};