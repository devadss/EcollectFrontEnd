import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const Profile = () => {
  return (
    <DashboardLayout role="softwareadmin">
      <div style={{ padding: '24px' }}>
        <h1>Profile</h1>
        <p style={{ color: '#888888' }}>User profile</p>
      </div>
    </DashboardLayout>
  );
};

export default Profile;