import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authRN from '@react-native-firebase/auth';

export type Role = 'super_admin' | 'admin' | 'user' | null;

type AuthState = {
  status: 'checking' | 'authenticated' | 'unauthenticated' | 'unauthorized';
  role: Role;
  user: any | null;
  marketplaceId?: string;
};

const initialState: AuthState = {
  status: 'checking',
  role: null,
  user: null,
  marketplaceId: undefined,
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  return new Promise<AuthState>((resolve) => {
    let resolved = false;
    
    const unsub = authRN().onAuthStateChanged(async (user) => {
      if (resolved) return;
      
      try {
        if (!user) {
          resolved = true;
          resolve({ status: 'unauthenticated', role: null, user: null });
          unsub();
          return;
        }
        
        // Verify with backend server
        try {
          const token = await user.getIdToken();
          const response = await fetch('https://circlebuy-server.onrender.com/auth/assign-role', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            };
            
            resolved = true;
            resolve({ 
              status: 'authenticated', 
              role: data.role, 
              user: userData,
              marketplaceId: data.marketplaceId 
            });
            unsub();
            return;
          } else if (response.status === 403) {
            resolved = true;
            resolve({ status: 'unauthorized', role: null, user: null });
            unsub();
            return;
          }
        } catch (error) {
          // Fallback for SuperAdmin offline access
          if (user.email === 'circlebuy0018@gmail.com') {
            const userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            };
            
            resolved = true;
            resolve({ 
              status: 'authenticated', 
              role: 'super_admin', 
              user: userData,
              marketplaceId: null 
            });
            unsub();
            return;
          }
        }
        
        // If backend verification fails, set unauthenticated
        resolved = true;
        resolve({ status: 'unauthenticated', role: null, user: null });
        unsub();
      } catch (error) {
        if (!resolved) {
          resolved = true;
          resolve({ status: 'unauthenticated', role: null, user: null });
          unsub();
        }
      }
    });
  });
});

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole(state, { payload }) { state.role = payload; },
    signOutLocal(state) { state.status = 'unauthenticated'; state.role = null; state.user = null; state.marketplaceId = undefined; },
    setUnauthorized(state) { state.status = 'unauthorized'; state.role = null; state.user = null; state.marketplaceId = undefined; },
    updateAuthState(state, { payload }) {
      state.status = payload.status;
      state.role = payload.role;
      state.user = payload.user;
      state.marketplaceId = payload.marketplaceId;
    }
  },
  extraReducers(builder) {
    builder.addCase(bootstrapAuth.fulfilled, (state, { payload }) => {
      state.status = payload.status;
      state.role = payload.role;
      state.user = payload.user;
    });
  }
});

export const { setRole, signOutLocal, updateAuthState, setUnauthorized } = slice.actions;
export default slice.reducer;