import { Activity, Cpu, Database, ShieldCheck, Server, Users, Zap } from 'lucide-react';
import { useChatStore, HermesHealth } from '../stores/chatStore';

function FeatureBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-hermes-500/10 bg-void-700/50 px-2.5 py-1.5 font-mono text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={enabled ? 'neon-badge text-terminal-green' : 'text-slate-600'}>
        {enabled ? 'ON' : '—'}
      </span>
    </div>
  );
}

function DetailedHealthMetrics({ details }: { details: Record<string, unknown> }) {
  const activeSessions = details.active_sessions ?? details.activeSessions;
  const runningAgents = details.running_agents ?? details.runningAgents;
  const uptime = details.uptime;
  const resources = details.resources ?? details.resource_usage;

  if (!activeSessions && !runningAgents && !uptime) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {activeSessions !== undefined && (
        <div className="rounded-md border border-hermes-500/10 bg-void-700/50 p-2 text-center">
          <Users size={12} className="mx-auto mb-1 text-hermes-400/60" />
          <p className="font-mono text-sm font-bold text-hermes-200">{String(activeSessions)}</p>
          <p className="font-mono text-[0.55rem] text-slate-500">sessions</p>
        </div>
      )}
      {runningAgents !== undefined && (
        <div className="rounded-md border border-hermes-500/10 bg-void-700/50 p-2 text-center">
          <Zap size={12} className="mx-auto mb-1 text-terminal-green/60" />
          <p className="font-mono text-sm font-bold text-terminal-green">{String(runningAgents)}</p>
          <p className="font-mono text-[0.55rem] text-slate-500">agents</p>
        </div>
      )}
      {uptime !== undefined && (
        <div className="rounded-md border border-hermes-500/10 bg-void-700/50 p-2 text-center">
          <Server size={12} className="mx-auto mb-1 text-terminal-cyan/60" />
          <p className="font-mono text-sm font-bold text-terminal-cyan">{String(uptime)}</p>
          <p className="font-mono text-[0.55rem] text-slate-500">uptime</p>
        </div>
      )}
      {resources != null && typeof resources === 'object' ? (
        <div className="col-span-3 rounded-md border border-hermes-500/10 bg-void-700/50 p-2">
          <p className="mb-1 font-mono text-[0.6rem] text-slate-500">resources</p>
          <pre className="font-mono text-[0.6rem] leading-4 text-slate-400">
            {JSON.stringify(resources as Record<string, unknown>, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export function AgentPanel() {
  const health = useChatStore((state) => state.health);
  const capabilities = useChatStore((state) => state.capabilities);
  const models = useChatStore((state) => state.models);
  const features = capabilities?.features ?? {};
  const connected = Boolean(health?.connected);

  return (
    <section className="terminal-panel">
      <div className="terminal-panel-header justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-hermes-300">AGENT STATUS</span>
        </div>
        <Activity
          size={14}
          className={connected ? 'text-terminal-green animate-pulse-slow' : 'text-terminal-red'}
        />
      </div>

      <div className="space-y-3 p-3">
        {/* Connection + Model */}
        <div className="rounded-md border border-hermes-500/10 bg-void-700/50 p-2.5">
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[0.65rem] text-slate-500">
            <Cpu size={11} />
            MODEL
          </div>
          <p className="font-mono text-xs text-hermes-200">
            {capabilities?.model ?? health?.model ?? 'hermes-agent'}
          </p>
          {models.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {models.map((m) => (
                <span
                  key={m.id}
                  className="rounded border border-hermes-500/10 bg-hermes-500/5 px-1.5 py-0.5 font-mono text-[0.6rem] text-hermes-400/70"
                >
                  {m.id}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Auth */}
        <div className="rounded-md border border-hermes-500/10 bg-void-700/50 p-2.5">
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[0.65rem] text-slate-500">
            <ShieldCheck size={11} />
            AUTH
          </div>
          <p className="font-mono text-[0.65rem] leading-4 text-slate-400">
            Bearer token injected by proxy. Not exposed to browser.
          </p>
        </div>

        {/* Detailed health metrics */}
        {health?.details && typeof health.details === 'object' && (
          <DetailedHealthMetrics details={health.details as Record<string, unknown>} />
        )}

        {/* Feature flags */}
        <div className="rounded-md border border-hermes-500/10 bg-void-700/50 p-2.5">
          <div className="mb-2 flex items-center gap-2 font-mono text-[0.65rem] text-slate-500">
            <Database size={11} />
            CAPABILITIES
          </div>
          <div className="grid gap-1.5">
            <FeatureBadge label="chat_completions" enabled={Boolean(features.chat_completions)} />
            <FeatureBadge label="responses_api" enabled={Boolean(features.responses_api)} />
            <FeatureBadge label="run_events_sse" enabled={Boolean(features.run_events_sse)} />
            <FeatureBadge label="run_submission" enabled={Boolean(features.run_submission)} />
            <FeatureBadge label="run_stop" enabled={Boolean(features.run_stop)} />
            <FeatureBadge label="run_status" enabled={Boolean(features.run_status)} />
          </div>
        </div>

        {/* Error display */}
        {health?.error && (
          <div className="rounded-md border border-terminal-red/15 bg-terminal-red/5 p-2.5">
            <p className="font-mono text-[0.65rem] text-terminal-red">{health.error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
