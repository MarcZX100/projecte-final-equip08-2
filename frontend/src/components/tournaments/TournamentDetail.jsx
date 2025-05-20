// src/pages/tournaments/TournamentDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import JoinTournamentForm from './JoinTournamentForm';
import { loadingSvg } from '../layout/svg';

export default function TournamentDetail() {
  const { apiFetch } = useApi();
  const { id }       = useParams();

  const [torneo, setTorneo]   = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // 1) Fetch de datos del torneo
  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/tournaments/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        setTorneo(data.torneo);
        setEquipos(data.equipos || []);
      } catch (err) {
        console.error("Error fetching tournament:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id, apiFetch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        {loadingSvg()}
      </div>
    );
  }

  if (error || !torneo) {
    return <p className="text-center mt-10 text-red-600">{error || 'Torneo no encontrado.'}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h2 className="text-3xl font-bold mb-4">{torneo.nombre}</h2>
      
      <p><strong>Fecha:</strong> {new Date(torneo.fecha).toLocaleDateString()}</p>
      <p><strong>Estado:</strong> {torneo.estado}</p>

      <div className="mt-4">
        <strong>Ubicación:</strong>{' '}
        <span>{torneo.address || 'Ubicación desconocida'}</span>
      </div>

      <p className="mt-6 font-semibold">
        Equipos participantes ({equipos.length}/{torneo.max_equipos})
      </p>
      <ul className="list-none mt-4 space-y-3">
        {equipos.map(e => (
          <li key={e.equipo_id} className="flex items-center">
            <img
              src={e.foto ? `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}${e.foto}` 
                          : `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}/uploads/user_placeholder.png`}
              alt={`Logo de ${e.nombre}`}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
            <Link to={`/teams/${e.equipo_id}`} className="text-lg font-medium">
              {e.nombre}
            </Link>
          </li>
        ))}
      </ul>

      {torneo.estado === 'abierto' && (
        <div className="mt-6">
          <JoinTournamentForm
            torneoId={id}
            currentEquipos={equipos}
            maxEquipos={torneo.max_equipos}
            onJoined={eq => setEquipos(prev => [...prev, eq])}
            onLeft={eq => setEquipos(prev => prev.filter(e => e.equipo_id !== eq.equipo_id))}
          />
        </div>
      )}

      <div className="mt-6">
        <Link
          to={`/torneos/${id}/bracket`}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Ver cuadro del torneo
        </Link>
      </div>
    </div>
  );
}
