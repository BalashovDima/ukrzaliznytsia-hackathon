import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, Play, Trash2, RefreshCw, Zap, ListPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import { toast } from "sonner";

export function DevPanel() {
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(5);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["shipments"] });
    queryClient.invalidateQueries({ queryKey: ["fleet"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["wagon-suggestion"] });
    queryClient.invalidateQueries({ queryKey: ["wagon-summary"] });
  };

  const stepMutation = useMutation({
    mutationFn: () => apiClient.stepSimulation(),
    onSuccess: (data) => {
      addLog(`Simulation stepped. ${data.arrived_wagons.length} wagons arrived.`);
      invalidateAll();
      toast.success("Simulation advanced 1 tick");
    },
  });

  const clearRequestsMutation = useMutation({
    mutationFn: () => apiClient.clearRequests(),
    onSuccess: () => {
      addLog("Cleared all pending requests from database.");
      invalidateAll();
      toast.info("Requests cleared");
    },
  });

  const resetFleetMutation = useMutation({
    mutationFn: () => apiClient.resetFleet(),
    onSuccess: () => {
      addLog("Randomized fleet positions globally.");
      invalidateAll();
      toast.info("Fleet randomized");
    },
  });

  const runMatchMutation = useMutation({
    mutationFn: () => apiClient.runMatching(),
    onSuccess: (data) => {
      addLog(`Global algorithm ran. Cost: ${data.total_empty_cost} ₴`);
      invalidateAll();
      toast.info("Matcher executed");
    },
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) => apiClient.generateRequests(count),
    onSuccess: (data) => {
      addLog(`Generated ${data.requests.length} random requests.`);
      invalidateAll();
      toast.success(`${data.requests.length} requests generated`);
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
          <Settings className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col h-full bg-slate-50">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> God Mode / Dev Panel
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Simulation Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => stepMutation.mutate()} 
                disabled={stepMutation.isPending}
                className="flex flex-col items-center justify-center gap-2 bg-white border shadow-sm p-4 rounded-xl hover:border-primary hover:bg-slate-50 transition-colors"
              >
                <Play className="h-6 w-6 text-green-500" />
                <span className="text-xs font-semibold">Step 1 Tick</span>
              </button>
              
              <button 
                onClick={() => runMatchMutation.mutate()} 
                disabled={runMatchMutation.isPending}
                className="flex flex-col items-center justify-center gap-2 bg-white border shadow-sm p-4 rounded-xl hover:border-primary hover:bg-slate-50 transition-colors"
              >
                <Zap className="h-6 w-6 text-yellow-500" />
                <span className="text-xs font-semibold">Force Algorithm</span>
              </button>
              
              <button 
                onClick={() => clearRequestsMutation.mutate()} 
                disabled={clearRequestsMutation.isPending}
                className="flex flex-col items-center justify-center gap-2 bg-white border shadow-sm p-4 rounded-xl hover:border-destructive hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-6 w-6 text-red-500" />
                <span className="text-xs font-semibold">Clear Requests</span>
              </button>
              
              <button 
                onClick={() => resetFleetMutation.mutate()} 
                disabled={resetFleetMutation.isPending}
                className="flex flex-col items-center justify-center gap-2 bg-white border shadow-sm p-4 rounded-xl hover:border-info hover:bg-blue-50 transition-colors"
              >
                <RefreshCw className="h-6 w-6 text-blue-500" />
                <span className="text-xs font-semibold">Randomize Fleet</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Generate Requests</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={50}
                value={generateCount}
                onChange={(e) => setGenerateCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-20 px-3 py-2 border rounded-lg text-sm font-semibold text-center bg-white shadow-sm"
              />
              <button
                onClick={() => generateMutation.mutate(generateCount)}
                disabled={generateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-white border shadow-sm p-3 rounded-xl hover:border-primary hover:bg-slate-50 transition-colors"
              >
                <ListPlus className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-semibold">Generate Requests</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-3 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Algorithm Logs</h3>
            <div className="flex-1 bg-slate-900 rounded-xl p-4 text-xs font-mono text-green-400 overflow-y-auto max-h-[300px] border border-slate-700 shadow-inner">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic">No logs yet...</div>
              ) : (
                <div className="space-y-1.5 flex flex-col">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
