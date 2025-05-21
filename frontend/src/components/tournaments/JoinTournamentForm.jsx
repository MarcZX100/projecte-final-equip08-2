// src/components/tournaments/JoinTournamentForm.jsx
import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../context/UserContext';
import { useApi } from '../../hooks/useApi';

function JoinTournamentForm({
  torneoId,
  currentEquipos,
  maxEquipos,
  onJoined,
  onLeft
}) {
  const { apiFetch } = useApi();
  const { token } = useContext(UserContext);
  const [equipo, setEquipo] = useState(null);
  const [globalInscrito, setGlobalInscrito] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  // Obtener equipo y si ya está inscrito globalmente
  useEffect(() => {
    if (!token) return;
    apiFetch(`/api/tournaments/miembros-equipo/capitan`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setEquipo(data.equipo);
        setGlobalInscrito(data.inscrito);
      })
      .catch(() => {
        setEquipo(null);
        setGlobalInscrito(false);
      });
  }, [token, apiFetch]);

  // Recalcular registro local cuando cambian props
  useEffect(() => {
    if (equipo) {
      const found = currentEquipos.some(e => e.equipo_id === equipo.id);
      setIsRegistered(found);
    }
  }, [equipo, currentEquipos]);

  if (!token) 
    return <p>Inicia sesión para unirte al torneo.</p>;
  if (!equipo) 
    return <p>No eres capitán de ningún equipo.</p>;
  if (globalInscrito && !isRegistered)
    return <p className="text-center mt-4 font-semibold text-red-600">
      Ya estás inscrito en otro torneo
    </p>;
  if (!isRegistered && currentEquipos.length >= maxEquipos)
    return <p className="text-center mt-4 font-semibold text-red-600">
      El torneo ya está lleno
    </p>;

  const handleJoin = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const res = await apiFetch(`/api/tournaments/${torneoId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipo_id: equipo.id })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(data.message);
        onJoined(equipo);
      } else {
        setMensaje(data.error);
      }
    } catch {
      setMensaje('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const res = await apiFetch(`/api/tournaments/${torneoId}/join`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipo_id: equipo.id })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje(data.message);
        onLeft(equipo);
      } else {
        setMensaje(data.error);
      }
    } catch {
      setMensaje('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p>Equipo: <strong>{equipo.nombre}</strong></p>
      <button
        type="button"
        onClick={isRegistered ? handleLeave : handleJoin}
        disabled={loading}
        className={`px-4 py-2 rounded-full mt-2 transition font-semibold text-white
          ${isRegistered
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gray-800 hover:bg-gray-900'
          }
          disabled:opacity-50`}
      >
        {loading
          ? (isRegistered ? 'Procesando...' : 'Enviando...')
          : (isRegistered ? 'Salir del torneo' : 'Unirse al torneo')}
      </button>
      {mensaje && <p className="mt-2">{mensaje}</p>}
    </div>
  );
}

export default JoinTournamentForm;
