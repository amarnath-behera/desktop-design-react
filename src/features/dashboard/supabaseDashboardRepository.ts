import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import {
  BrowserDashboardRepository,
  isDashboardData,
  readBrowserDashboardData,
  type DashboardData,
  type DashboardRepository,
} from "./dashboardData";

const emptyDashboardData: DashboardData = {
  expenses: [],
  vehicleTransactions: [],
  rentTransactions: [],
  borrowings: [],
  investmentPlans: [],
};

export class SupabaseDashboardRepository implements DashboardRepository {
  private readonly snapshots = new Map<string, DashboardData>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly writeQueues = new Map<string, Promise<void>>();
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  getSnapshot(key: string) {
    return this.snapshots.get(key) ?? emptyDashboardData;
  }

  subscribe(key: string, listener: () => void) {
    const subscribers = this.listeners.get(key) ?? new Set<() => void>();
    subscribers.add(listener);
    this.listeners.set(key, subscribers);
    return () => {
      subscribers.delete(listener);
      if (subscribers.size === 0) this.listeners.delete(key);
    };
  }

  async load(key: string, legacyKey?: string) {
    const { data, error } = await this.client.rpc("get_dashboard_data");
    if (error) throw error;
    if (!isDashboardData(data)) throw new Error("Supabase returned an invalid dashboard data shape.");

    let snapshot = data;
    const legacyData = legacyKey ? readBrowserDashboardData(legacyKey) : null;
    const remoteIsEmpty = Object.values(data).every((entries) => entries.length === 0);
    const legacyHasData = legacyData !== null && Object.values(legacyData).some((entries) => entries.length > 0);
    if (remoteIsEmpty && legacyHasData) {
      await this.persist(key, legacyData);
      snapshot = legacyData;
    }

    this.snapshots.set(key, snapshot);
    this.notify(key);
    return snapshot;
  }

  update(key: string, update: (current: DashboardData) => DashboardData) {
    const next = update(this.getSnapshot(key));
    this.snapshots.set(key, next);
    this.notify(key);
    const previousWrite = this.writeQueues.get(key) ?? Promise.resolve();
    const nextWrite = previousWrite.catch(() => undefined).then(() => this.persist(key, next));
    this.writeQueues.set(key, nextWrite);
    void nextWrite.catch((error: unknown) => console.error("Unable to save dashboard data to Supabase.", error));
  }

  private async persist(key: string, data: DashboardData) {
    const { error } = await this.client.rpc("save_dashboard_data", { p_data: data });
    if (error) throw error;
    this.snapshots.set(key, data);
  }

  private notify(key: string) {
    this.listeners.get(key)?.forEach((listener) => listener());
  }
}

export const supabaseDashboardRepository = supabase ? new SupabaseDashboardRepository(supabase) : null;
export const dashboardRepository: DashboardRepository = supabaseDashboardRepository ?? new BrowserDashboardRepository();