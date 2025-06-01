/**
 * Debug component to test AuthContext functionality
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const AuthContextDebug: React.FC = () => {
  const authContext = useAuth();

  console.log('AuthContext Debug:', {
    context: authContext,
    signUp: authContext?.signUp,
    signIn: authContext?.signIn,
    signOut: authContext?.signOut,
    user: authContext?.user,
    session: authContext?.session,
    loading: authContext?.loading,
  });

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white' }}>
      <h2>AuthContext Debug</h2>
      <div>
        <p><strong>Context exists:</strong> {authContext ? 'Yes' : 'No'}</p>
        <p><strong>signUp function:</strong> {typeof authContext?.signUp}</p>
        <p><strong>signIn function:</strong> {typeof authContext?.signIn}</p>
        <p><strong>signOut function:</strong> {typeof authContext?.signOut}</p>
        <p><strong>User:</strong> {authContext?.user ? 'Logged in' : 'Not logged in'}</p>
        <p><strong>Loading:</strong> {authContext?.loading ? 'Yes' : 'No'}</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Function Tests:</h3>
        <button 
          onClick={() => {
            console.log('Testing signUp function availability:', authContext?.signUp);
            if (authContext?.signUp) {
              console.log('signUp function is available');
            } else {
              console.error('signUp function is NOT available');
            }
          }}
          style={{ 
            padding: '10px', 
            margin: '5px', 
            backgroundColor: '#ff3b30', 
            color: 'white', 
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test signUp Function
        </button>
        
        <button 
          onClick={() => {
            console.log('Testing signIn function availability:', authContext?.signIn);
            if (authContext?.signIn) {
              console.log('signIn function is available');
            } else {
              console.error('signIn function is NOT available');
            }
          }}
          style={{ 
            padding: '10px', 
            margin: '5px', 
            backgroundColor: '#34c759', 
            color: 'white', 
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test signIn Function
        </button>
      </div>
    </div>
  );
};

export default AuthContextDebug;
