"use client";
import { BACKEND_URL } from "@repo/secret/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus, X, Search, Layout, ArrowRight, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Syne, DM_Sans } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-syne",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm",
});

type RoomCard = {
  slug: string;
};

export default function App() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [recentRooms, setRecentRooms] = useState<RoomCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const createSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const onCreateRoom = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const slug = createSlug(roomName);
    const token = localStorage.getItem("token");

    if (!slug) {
      setError("Please enter a valid room name.");
      return;
    }
    if (!token) {
      router.push("/signin");
      return;
    }

    try {
      setIsCreating(true);
      const response = await axios.post(
        `${BACKEND_URL}/create-room`,
        { name: slug },
        { headers: { token } }
      );

      if (response.data?.roomId) {
        router.push(`/canvas/${slug}`);
        return;
      }
      setError(response.data?.message ?? "Unable to create room.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message as string);
      } else {
        setError("Unable to create room. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }
    axios
      .get(`${BACKEND_URL}/user-room`, { headers: { token } })
      .then((response) => setRecentRooms(response.data.rooms))
      .catch((err) => console.error("Error fetching recent rooms:", err));
  }, []);

  const filteredRooms = recentRooms.filter((room) =>
    room.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .app-root {
          min-height: 100vh;
          background: #0d0f1a;
          color: #e7e9f1;
          font-family: var(--font-dm), ui-sans-serif, system-ui, sans-serif;
        }

        .app-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(111,99,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(111,99,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .content { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 48px 24px; }

        .header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 40px; }
        .eyebrow { font-family: var(--font-dm), sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6f63ff; margin-bottom: 6px; }
        .page-title { font-family: var(--font-syne), sans-serif; font-size: 32px; font-weight: 700; color: #fff; line-height: 1.1; }

        .search-bar {
          display: flex; align-items: center; gap: 10px;
          background: #1b1e2c;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 16px;
          width: 260px;
          transition: border-color 0.2s;
        }
        .search-bar:focus-within { border-color: #6f63ff; }
        .search-bar svg { color: rgba(255,255,255,0.35); flex-shrink: 0; }
        .search-input {
          background: none; border: none; outline: none;
          color: #e7e9f1;
          font-family: var(--font-dm), sans-serif;
          font-size: 14px; width: 100%;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.3); }

        .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

        .create-card {
          min-height: 200px; border-radius: 18px;
          border: 1.5px dashed rgba(111,99,255,0.4);
          background: rgba(111,99,255,0.05);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; cursor: pointer; transition: all 0.25s; padding: 32px;
        }
        .create-card:hover { border-color: #6f63ff; background: rgba(111,99,255,0.1); transform: translateY(-2px); }
        .create-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(111,99,255,0.15); border: 1px solid rgba(111,99,255,0.3);
          display: flex; align-items: center; justify-content: center;
          color: #6f63ff; transition: all 0.25s;
        }
        .create-card:hover .create-icon { background: rgba(111,99,255,0.25); }
        .create-label { font-family: var(--font-syne), sans-serif; font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.7); transition: color 0.2s; }
        .create-card:hover .create-label { color: #fff; }
        .create-sub { font-size: 12px; color: rgba(255,255,255,0.3); }

        .room-card {
          min-height: 200px; border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: #1b1e2c;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 28px; transition: all 0.25s; position: relative; overflow: hidden;
        }
        .room-card::before {
          content: ''; position: absolute; top: -40px; right: -40px;
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle, rgba(111,99,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .room-card:hover { border-color: rgba(111,99,255,0.35); background: #1f2335; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        .room-card-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(111,99,255,0.12);
          display: flex; align-items: center; justify-content: center;
          color: #6f63ff; margin-bottom: 16px;
        }
        .room-slug { font-family: var(--font-syne), sans-serif; font-size: 16px; font-weight: 600; color: #fff; word-break: break-all; margin-bottom: 6px; }
        .room-meta { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 24px; }
        .join-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(111,99,255,0.15); border: 1px solid rgba(111,99,255,0.3);
          color: #a89fff;
          font-family: var(--font-dm), sans-serif;
          font-size: 13px; font-weight: 500;
          padding: 9px 18px; border-radius: 10px;
          cursor: pointer; transition: all 0.2s; width: fit-content;
        }
        .join-btn:hover { background: #6f63ff; border-color: #6f63ff; color: #fff; }
        .join-btn svg { transition: transform 0.2s; }
        .join-btn:hover svg { transform: translateX(3px); }

        .empty { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3); font-size: 14px; grid-column: 1 / -1; }

        .stats-bar { display: flex; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
        .stat { font-size: 13px; color: rgba(255,255,255,0.4); }
        .stat strong { color: #e7e9f1; font-weight: 600; }

        .overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(5,6,14,0.75);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .modal {
          width: 100%; max-width: 440px;
          background: #1b1e2c;
          border: 1px solid rgba(111,99,255,0.25);
          border-radius: 22px; padding: 36px; margin: 16px;
          animation: slideUp 0.25s ease;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
        }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .modal-title { font-family: var(--font-syne), sans-serif; font-size: 19px; font-weight: 600; color: #fff; }
        .modal-close {
          width: 34px; height: 34px; border-radius: 10px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: rgba(255,255,255,0.5); transition: all 0.2s;
        }
        .modal-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .modal-label { font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
        .modal-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          padding: 14px 16px; color: #e7e9f1;
          font-family: var(--font-dm), sans-serif;
          font-size: 15px; outline: none;
          transition: border-color 0.2s, background 0.2s; margin-bottom: 8px;
        }
        .modal-input::placeholder { color: rgba(255,255,255,0.25); }
        .modal-input:focus { border-color: #6f63ff; background: rgba(111,99,255,0.06); }
        .slug-preview { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 24px; min-height: 18px; }
        .slug-preview span { color: #6f63ff; }
        .modal-error {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px; padding: 10px 14px;
          font-size: 13px; color: #fca5a5; margin-bottom: 20px;
        }
        .modal-submit {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #6f63ff; border: none; border-radius: 12px; padding: 14px;
          color: #fff; font-family: var(--font-syne), sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .modal-submit:hover:not(:disabled) { background: #5f54ea; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(111,99,255,0.35); }
        .modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className={`${syne.variable} ${dmSans.variable} app-root`}>
        <div className="content">
          <div className="header">
            <div>
              <div className="eyebrow">Workspace</div>
              <h1 className="page-title">Your Rooms</h1>
            </div>
            <div className="search-bar">
              <Search size={15} />
              <input
                className="search-input"
                placeholder="Search rooms…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="stats-bar">
            <div className="stat"><strong>{recentRooms.length}</strong> total rooms</div>
            {searchQuery && (
              <div className="stat">
                <strong>{filteredRooms.length}</strong> matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          <div className="rooms-grid">
            <div className="create-card" onClick={() => setShowCreate(true)}>
              <div className="create-icon"><Plus size={22} /></div>
              <div className="create-label">New Room</div>
              <div className="create-sub">Start a fresh canvas</div>
            </div>

            {filteredRooms.length === 0 && searchQuery ? (
              <div className="empty">No rooms match &quot;{searchQuery}&quot;</div>
            ) : (
              filteredRooms.map((room) => (
                <div key={room.slug} className="room-card">
                  <div>
                    <div className="room-card-icon"><Layout size={20} /></div>
                    <div className="room-slug">{room.slug}</div>
                    <div className="room-meta">Canvas room</div>
                  </div>
                  <button
                    className="join-btn"
                    onClick={() => router.push(`/canvas/${room.slug}`)}
                  >
                    Open room <ArrowRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <div
          className={`${syne.variable} ${dmSans.variable} overlay`}
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Create a room</div>
              <div className="modal-close" onClick={() => setShowCreate(false)}>
                <X size={16} />
              </div>
            </div>
            <form onSubmit={onCreateRoom}>
              <div className="modal-label">Room name</div>
              <input
                className="modal-input"
                placeholder="e.g. design-sprint, q4-planning…"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                autoFocus
              />
              <div className="slug-preview">
                {roomName
                  ? <>/&nbsp;<span>{createSlug(roomName)}</span></>
                  : "Enter a name to preview the slug"}
              </div>
              {error && (
                <div className="modal-error"><X size={14} /> {error}</div>
              )}
              <button type="submit" className="modal-submit" disabled={isCreating}>
                {isCreating ? (
                  <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating…</>
                ) : (
                  <>Create room <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}