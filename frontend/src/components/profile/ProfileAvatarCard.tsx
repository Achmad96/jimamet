interface ProfileAvatarCardProps {
  fullName: string;
  username: string;
}

export function ProfileAvatarCard({ fullName, username }: ProfileAvatarCardProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-7 text-center flex flex-col items-center justify-center gap-1.5">
      <div className="w-17 h-17 rounded-lg bg-primary flex items-center justify-center mb-1.5">
        <span className="font-headline text-[28px] font-bold text-on-primary">{(fullName || "P").charAt(0).toUpperCase()}</span>
      </div>
      <h3 className="font-headline text-[17px] font-bold text-on-surface">{fullName || "Pengguna"}</h3>
      <p className="font-mono text-xs text-outline">@{username || "user"}</p>
      <span className="mt-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary font-mono text-[10px] font-semibold tracking-wider">AKUN PASIEN AKTIF</span>
    </div>
  );
}
