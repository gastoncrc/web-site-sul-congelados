import { MapPin, Mail, MessageCircle } from 'lucide-react';

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const CONTACT_LINKS = [
  { href: 'https://wa.me/5493518042031', Icon: MessageCircle, label: 'WhatsApp', value: '351 804-2031', iconBg: 'bg-whatsapp/15 text-whatsapp-deep' },
  { href: 'https://instagram.com/sulcongelados.cba', Icon: InstagramIcon, label: 'Instagram', value: '@sulcongelados.cba', iconBg: 'bg-brand-gold/15 text-brand-gold-deep' },
  { href: 'mailto:sulcongelados.arg@gmail.com', Icon: Mail, label: 'Email', value: 'sulcongelados.arg@gmail.com', iconBg: 'bg-brand-primary/10 text-brand-primary' },
];

export const Contacto = () => (
  <div className="bg-paper rounded-card border border-line p-8 shadow-sm max-w-2xl mx-auto space-y-6">
    <div>
      <h2 className="text-xl font-black text-brand-primary">CONTACTO</h2>
      <div className="flex items-center space-x-3 text-sm text-ink-soft mt-2"><MapPin size={16} /> <span>Córdoba, Argentina</span></div>
    </div>
    <div className="space-y-3">
      {CONTACT_LINKS.map(({ href, Icon, label, value, iconBg }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-xl border border-line hover:border-brand-gold hover:bg-bg transition group"
        >
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="text-sm font-bold text-ink group-hover:text-brand-primary transition">{value}</p>
          </div>
        </a>
      ))}
    </div>
  </div>
);
