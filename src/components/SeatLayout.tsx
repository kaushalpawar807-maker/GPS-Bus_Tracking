import { User } from 'lucide-react';

interface SeatLayoutProps {
    onSeatSelect: (seats: string[]) => void;
    selectedSeats: string[];
    maxSeats: number;
}

export default function SeatLayout({ onSeatSelect, selectedSeats, maxSeats: _maxSeats = 40 }: SeatLayoutProps) {
    // Generate mock seat layout (Right side 2, Left side 2, Last row 5)
    const rows = 10;

    const handleSeatClick = (seatId: string) => {
        if (selectedSeats.includes(seatId)) {
            onSeatSelect(selectedSeats.filter(id => id !== seatId));
        } else {
            onSeatSelect([...selectedSeats, seatId]);
        }
    };

    const renderSeat = (seatId: string) => {
        const isSelected = selectedSeats.includes(seatId);
        // Randomly occupy some seats for realism
        const isOccupied = !isSelected && parseInt(seatId.replace(/\D/g, '')) % 7 === 0;

        return (
            <button
                key={seatId}
                onClick={() => !isOccupied && handleSeatClick(seatId)}
                disabled={isOccupied}
                className={`
          w-10 h-10 rounded-lg flex items-center justify-center m-1 transition-all
          ${isOccupied
                        ? 'bg-slate-200 cursor-not-allowed'
                        : isSelected
                            ? 'bg-slate-800 text-white ring-2 ring-offset-1 ring-slate-800'
                            : 'bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-500'
                    }
        `}
            >
                <User className={`w-5 h-5 ${isOccupied ? 'opacity-30' : ''}`} />
            </button>
        );
    };

    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 max-w-sm mx-auto">
            <div className="text-center text-xs text-slate-400 mb-6 font-medium uppercase tracking-wider">Front of Bus</div>

            <div className="flex justify-between gap-8">
                <div className="flex-1 space-y-2">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={`row-${i}-left`} className="flex justify-end gap-2">
                            {renderSeat(`A${i + 1}`)}
                            {renderSeat(`B${i + 1}`)}
                        </div>
                    ))}
                </div>

                <div className="flex-1 space-y-2">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={`row-${i}-right`} className="flex justify-start gap-2">
                            {renderSeat(`C${i + 1}`)}
                            {renderSeat(`D${i + 1}`)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
