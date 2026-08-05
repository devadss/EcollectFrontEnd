import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { settlementApi } from '../../services/api';

const SettlementDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [settlement, setSettlement] = useState(null);

  useEffect(() => {
    loadSettlement();
  }, [id]);

  const loadSettlement = async () => {
    try {
      const res = await settlementApi.getById(id);
      setSettlement(res.data);
    } catch (error) {
      console.error('Error loading settlement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!settlement) return <div>Settlement not found</div>;

  return (
    <DashboardLayout role="softwareadmin">
      <div style={{ padding: '24px' }}>
        <button onClick={() => navigate('/settlements')} style={{ marginBottom: '16px', background: 'transparent', border: '1px solid #e5e5e5', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <h1>Settlement #{settlement.id}</h1>
        <p>Amount: ₹{settlement.amount?.toLocaleString()}</p>
        <p>Status: {settlement.status}</p>
        <p>Date: {new Date(settlement.date).toLocaleDateString()}</p>
      </div>
    </DashboardLayout>
  );
};

export default SettlementDetails;