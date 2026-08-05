import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const Notifications = () => {
  return (
    <DashboardLayout role="softwareadmin">
      <div style={{ padding: '24px' }}>
        <h1>Notifications</h1>
        <p style={{ color: '#888888' }}>No notifications</p>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;