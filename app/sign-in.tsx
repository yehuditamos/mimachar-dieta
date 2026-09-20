'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, LockKeyhole, LoaderCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { authClient } from '@/lib/auth/client';

export default function SignIn({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(n => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function send() {
    if (busy || cooldown) return;
    setBusy(true); setError('');
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email: email.trim().toLowerCase(), type: 'sign-in' });
      if (result.error) {
        setError(result.error.status === 429 ? 'שלחנו כמה קודים ברצף. חכי רגע ונסי שוב.' : 'לא הצלחנו לשלוח קוד. בדקי את כתובת האימייל ונסי שוב.');
        return;
      }
      setSent(true); setCode(''); setCooldown(60);
    } catch { setError('יש קושי להתחבר. הפרטים נשארו כאן, נסי שוב.'); }
    finally { setBusy(false); }
  }
  async function verify() {
    if (busy || code.length !== 6) return;
    setBusy(true); setError('');
    try {
      const result = await authClient.signIn.emailOtp({ email: email.trim().toLowerCase(), otp: code });
      if (result.error) {
        setError(result.error.status === 429 ? 'יותר מדי ניסיונות. בקשי קוד חדש בעוד רגע.' : 'הקוד לא תקין או שפג התוקף שלו. נסי שוב או בקשי קוד חדש.');
        return;
      }
      await onSuccess();
    } catch { setError('הכניסה לא הושלמה. נסי שוב בעוד רגע.'); }
    finally { setBusy(false); }
  }
  return <div className="card stack">
    <div className="row"><Mail size={24}/><h2>{sent ? 'הקוד כבר בדרך אלייך' : 'נכנסת עם האימייל שלך'}</h2></div>
    <p className="muted">{sent ? <>שלחנו קוד חד־פעמי ל־<bdi>{email}</bdi>. אם הוא לא הגיע, בדקי גם בספאם.</> : 'בלי סיסמה לזכור. נשלח לך קוד קצר ונשמור את המקום שלך בקבוצה.'}</p>
    {sent ? <form className="stack" onSubmit={e => { e.preventDefault(); void verify(); }}>
      <label htmlFor="email-code" className="field">הקוד שקיבלת באימייל</label>
      <div dir="ltr"><InputOTP id="email-code" aria-label="הקוד שקיבלת באימייל" autoComplete="one-time-code" inputMode="numeric" pattern="^[0-9]*$" maxLength={6} value={code} onChange={setCode} disabled={busy} containerClassName="justify-center"><InputOTPGroup>{Array.from({length:6},(_,i)=><InputOTPSlot className="h-12 w-10 text-lg" key={i} index={i}/>)}</InputOTPGroup></InputOTP></div>
      <Button className="primary" disabled={busy || code.length !== 6}>{busy ? <LoaderCircle className="spinner"/> : <>נכנסת לקבוצה <ArrowLeft/></>}</Button>
      <Button type="button" variant="outline" className="secondary" disabled={busy || cooldown > 0} onClick={()=>void send()}>{cooldown ? `אפשר לשלוח שוב בעוד ${cooldown} שניות` : 'שולחת לי קוד חדש'}</Button>
      <button type="button" className="textlink" disabled={busy} onClick={()=>{setSent(false);setCode('');setError('');}}>תיקון כתובת האימייל</button>
    </form> : <form className="stack" onSubmit={e => { e.preventDefault(); void send(); }}>
      <label className="field">האימייל שלך<input type="email" dir="ltr" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>
      <Button className="primary" disabled={busy || cooldown > 0}>{busy ? <LoaderCircle className="spinner"/> : cooldown ? `אפשר לשלוח שוב בעוד ${cooldown} שניות` : <>שלחי לי קוד <ArrowLeft/></>}</Button>
    </form>}
    {error&&<p role="alert" className="error">{error}</p>}
    <p className="note"><LockKeyhole size={16}/>האימייל והיעדים האישיים שלך לא מוצגים בקבוצה.</p>
  </div>;
}
