import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #faf8f5 0%, #f5f1ed 100%)',
            padding: '40px 24px'
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '500px'
            }}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="#9b6b6b" style={{ marginBottom: '24px' }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                <h1 style={{ fontSize: '32px', color: '#3d3d3d', marginBottom: '16px' }}>
                    Hello, {user.name || user.username || 'User'}
                </h1>
                <p style={{ fontSize: '16px', color: '#8b8b8b', marginBottom: '32px' }}>
                    Your profile page is coming soon. You'll be able to manage your account details, preferences, and more.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Link to="/" style={{
                        display: 'inline-block',
                        padding: '12px 32px',
                        background: '#9b6b6b',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                    }}>
                        Back to Home
                    </Link>

                    <button onClick={handleLogout} style={{
                        display: 'inline-block',
                        padding: '12px 32px',
                        background: 'transparent',
                        border: '2px solid #9b6b6b',
                        color: '#9b6b6b',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                    }}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
