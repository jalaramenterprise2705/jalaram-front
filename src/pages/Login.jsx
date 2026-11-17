import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import { api } from '../lib/api';
import { notify } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input, Label, Card } from '../components/ui/input';

export default function Login() {
  const [f, setF] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', f);
      localStorage.setItem('token', data.token);
      notify.ok('Logged in');
      nav('/sales');
    }
    catch (er) {
      notify.err(er);
    }
    finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 p-4"
    >
      <Card className="w-full max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <div className="text-center">
            <div
              className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"
            >
              <FiLock size={22} />
            </div>
            <h1 className="text-xl font-bold">Jalaram Enterprise</h1>
          </div>
          <div>
            <Label>Username</Label>
            <Input
              value={f.username}
              onChange={(e) => setF({ ...f, username: e.target.value })}
              autoFocus
              required
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={busy}>Login</Button>
        </form>
      </Card>
    </div>
  );
}
