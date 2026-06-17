import { PlusIcon, RefreshCwIcon } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function Header({
  onAddClick,
  onRefresh,
  loading,
}: Readonly<HeaderProps>) {
  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        {/* Title — matches Figma: Plus Jakarta Sans, 28px, Bold, #0E626E */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: '28px',
            lineHeight: '35px',
            color: '#0E626E',
          }}
        >
          Product Management
        </h1>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center justify-center w-[42px] h-[42px] rounded-xl transition hover:opacity-80 disabled:opacity-50"
              style={{ background: 'rgba(246, 245, 248, 0.54)' }}
              title="Refresh"
            >
              <RefreshCwIcon
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                style={{ color: '#0B818D' }}
              />
            </button>
          )}

          {/* + Add button — matches Figma: #0B818D bg, Inter 16px, white text */}
          <button
            onClick={onAddClick}
            className="flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{
              background: '#0B818D',
              borderRadius: '10px',
              padding: '6px 16px',
              height: '42px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '19px',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            <PlusIcon className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </header>
  );
}
