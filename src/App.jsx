import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {
  LayoutDashboard,
  Landmark,
  UserRound,
  UsersRound,
  Plus,
  BarChart3,
  Target,
  PiggyBank,
  Repeat2,
  Receipt,
  FileText,
  Settings,
  Search,
  Bell,
  LogOut,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Utensils,
  Home,
  ShoppingCart,
  Car,
  Gamepad2,
  Smartphone,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  CreditCard,
  Gift,
  Plane,
  MoreHorizontal,
  X,
  Check,
  Trash2,
  Edit3,
  ArrowRight,
  RefreshCw,
  Camera,
  UserCircle
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";


// ============================================================
// CONSTANTS
// ============================================================

const CATEGORIES = [
  ["Food", "🍔"],
  ["Rent & Home", "🏠"],
  ["Groceries", "🛒"],
  ["Transport", "🚗"],
  ["Shopping", "🛍️"],
  ["Entertainment", "🎮"],
  ["Mobile & Internet", "📱"],
  ["Fitness", "💪"],
  ["Education", "📚"],
  ["Health", "💊"],
  ["EMI / Loan", "💳"],
  ["Gifts", "🎁"],
  ["Travel", "✈️"],
  ["Other", "📦"]
];

const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
  "Wallet",
  "Other"
];

const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Bonus",
  "Allowance",
  "Interest",
  "Other"
];

const ANALYTICS_COLORS = [
  "#7C3AED",
  "#2563EB",
  "#059669",
  "#F59E0B",
  "#EF4444",
  "#DB2777",
  "#0891B2",
  "#EA580C",
  "#65A30D",
  "#4F46E5",
  "#9333EA",
  "#0F766E"
];


// ============================================================
// HELPERS
// ============================================================

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(n || 0));

const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const localDateKey = (value) => {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
  }
  const dmy = text.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmy) {
    return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};

const normalizeTransaction = (row) => {
  if (!row) return row;
  const rawType = String(row.type || "").trim().toLowerCase().replace(/[- ]+/g, "_");
  const typeMap = {
    expense: "expense", expenses: "expense",
    income: "income", incomes: "income",
    saving: "savings", savings: "savings",
    shared: "shared_expense", shared_expense: "shared_expense",
    sharedexpense: "shared_expense",
    settlement: "settlement"
  };
  return {
    ...row,
    type: typeMap[rawType] || rawType,
    amount: Number(row.amount || 0),
    transaction_date: localDateKey(row.transaction_date)
  };
};

const isExpenseType = (type) =>
  type === "expense" || type === "shared_expense";

const iconFor = (cat) =>
  ({
    Food: Utensils,
    "Rent & Home": Home,
    Groceries: ShoppingCart,
    Transport: Car,
    Entertainment: Gamepad2,
    "Mobile & Internet": Smartphone,
    Fitness: Dumbbell,
    Education: GraduationCap,
    Health: HeartPulse,
    "EMI / Loan": CreditCard,
    Gifts: Gift,
    Travel: Plane
  }[cat] || MoreHorizontal);


// Compress profile pictures before uploading.
const optimizeAvatar = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not process the image."));
      image.onload = () => {
        const maxSize = 800;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process the image."));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Could not compress the image.")),
          "image/webp",
          0.86
        );
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });


// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState("overview");

  const [account, setAccount] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [settings, setSettings] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [defaultProfile, setDefaultProfile] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [toast, setToast] = useState("");
  const [dark, setDark] = useState(false);

  // Profile picture is stored in Supabase Storage and the public URL is
  // stored on the shared account row. This keeps the picture available
  // after refresh, logout/login, and on other devices.
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);


  // ==========================================================
  // AUTH
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("Auth session error:", error);
        setSession(null);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Keep the loading screen visible until the shared finance
        // account has also been loaded. This prevents Add Transaction
        // from opening while account is still null.
        setSession(data.session);
      } else {
        setSession(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (!nextSession) {
        setAccount(null);
        setProfiles([]);
        setTransactions([]);
        setGoals([]);
        setBudgets([]);
        setRecurring([]);
        setSettlements([]);
        setBankAccounts([]);
        setSettings(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  // ==========================================================
  // INITIALIZE ACCOUNT
  // ==========================================================

  useEffect(() => {
    if (session) {
      initialize();
    }
  }, [session]);


  // ==========================================================
  // DARK MODE
  // ==========================================================

  useEffect(() => {
    document.documentElement.dataset.theme = dark
      ? "dark"
      : "light";
  }, [dark]);


  // ==========================================================
  // INITIALIZE
  // ==========================================================

  const initialize = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError || new Error("Your login session is not available.");
      }

      // IMPORTANT: Always resolve the finance account from the currently
      // authenticated user's owner_user_id first. The old implementation
      // trusted the return value of ensure_account(), which can be wrong or
      // empty in older Supabase projects. Your account table is already
      // correctly linked to auth.users, so the authenticated user is the
      // authoritative source for the account UUID.
      let aid = null;

      const { data: existingAccount, error: accountLookupError } =
        await supabase
          .from("accounts")
          .select("*")
          .eq("owner_user_id", user.id)
          .maybeSingle();

      if (accountLookupError) {
        console.error("Account lookup failed:", accountLookupError);
        throw new Error(
          `Could not access your finance account. ${accountLookupError.message || "Please check the accounts RLS policy."}`
        );
      }

      if (existingAccount?.id) {
        aid = existingAccount.id;
      }

      // Only use ensure_account as a fallback for a genuinely new user.
      // It is never allowed to override an existing account found above.
      if (!aid) {
        const { data: rpcAid, error: rpcError } =
          await supabase.rpc("ensure_account");

        if (rpcError) {
          console.error("ensure_account fallback failed:", rpcError);
        } else if (rpcAid) {
          aid = rpcAid;
        }
      }

      if (!aid) {
        throw new Error(
          "Your finance account could not be found for this login. Please run the account setup SQL once, then sign in again."
        );
      }

      const loaded = await loadAll(aid);
      if (!loaded) {
        throw new Error(
          "Your finance account could not be loaded. Check the Accounts RLS policy in Supabase."
        );
      }
    } catch (error) {
      console.error("Finance initialization failed:", error);
      setAccount(null);
      showToast(error?.message || "Could not load your finance account.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // LOAD ALL DATA
  // ==========================================================

  const loadAll = async (aid) => {
    const [
      a,
      p,
      t,
      g,
      b,
      r,
      s,
      ba,
      st
    ] = await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("id", aid)
        .single(),

      supabase
        .from("profiles")
        .select("*")
        .eq("account_id", aid)
        .order("created_at"),

      supabase
        .from("transactions")
        .select("*")
        .eq("account_id", aid)
        .order("transaction_date", {
          ascending: false
        })
        .order("created_at", {
          ascending: false
        }),

      supabase
        .from("savings_goals")
        .select("*")
        .eq("account_id", aid)
        .order("created_at", {
          ascending: false
        }),

      supabase
        .from("budgets")
        .select("*")
        .eq("account_id", aid)
        .order("month", {
          ascending: false
        }),

      supabase
        .from("recurring_transactions")
        .select("*")
        .eq("account_id", aid)
        .order("next_due_date"),

      supabase
        .from("settlements")
        .select("*")
        .eq("account_id", aid)
        .order("created_at", {
          ascending: false
        }),

      supabase
        .from("bank_accounts")
        .select("*")
        .eq("account_id", aid)
        .order("bank_name"),

      supabase
        .from("settings")
        .select("*")
        .eq("account_id", aid)
        .single()
    ]);


    if (a.error || !a.data) {
      console.error("Finance account load failed:", a.error);
      setAccount(null);
      setAvatarUrl("");
      return false;
    }

    setAccount(a.data);
    setAvatarUrl(a.data.avatar_url || "");

    // ----------------------------------------------------------
    // GUARANTEE THE TWO FINANCE PROFILES EXIST
    // ----------------------------------------------------------
    // An older account can exist without profile rows because
    // ensure_account only creates profiles when the account itself
    // is first created. In that case the UI used to show Santhosh and
    // Sindhuja as disabled fallback buttons with empty IDs.
    //
    // We repair that here using the account owner RLS policy. This
    // gives both people real UUIDs, so clicking either person can be
    // saved into transactions.profile_id.
    let loadedProfiles = Array.isArray(p.data) ? [...p.data] : [];

    const desiredNames = [
      st.data?.person_one_name || "Santhosh",
      st.data?.person_two_name || "Sindhuja"
    ];

    const existingNames = new Set(
      loadedProfiles.map((item) => String(item.name || "").trim())
    );

    const missingNames = desiredNames.filter(
      (name) => !existingNames.has(name)
    );

    if (a.data && missingNames.length) {
      const { data: repairedProfiles, error: profileRepairError } =
        await supabase
          .from("profiles")
          .upsert(
            missingNames.map((name) => ({
              account_id: aid,
              name
            })),
            { onConflict: "account_id,name" }
          )
          .select("*");

      if (profileRepairError) {
        console.error("Profile bootstrap failed:", profileRepairError);
      } else if (repairedProfiles?.length) {
        loadedProfiles = [...loadedProfiles, ...repairedProfiles];
      }
    }

    // If settings was missing on an older account, repair that too.
    if (a.data && !st.data) {
      const { data: repairedSettings, error: settingsRepairError } =
        await supabase
          .from("settings")
          .upsert(
            {
              account_id: aid,
              person_one_name: desiredNames[0],
              person_two_name: desiredNames[1],
              currency: "INR"
            },
            { onConflict: "account_id" }
          )
          .select("*")
          .maybeSingle();

      if (settingsRepairError) {
        console.error("Settings bootstrap failed:", settingsRepairError);
      } else if (repairedSettings) {
        setSettings(repairedSettings);
        setDark(Boolean(repairedSettings.dark_mode));
      }
    }

    // Keep the intended Person 1 / Person 2 order.
    const fallbackNames = desiredNames;
    loadedProfiles = [...loadedProfiles].sort((x, y) => {
      const xi = fallbackNames.indexOf(x.name);
      const yi = fallbackNames.indexOf(y.name);
      return (xi < 0 ? 99 : xi) - (yi < 0 ? 99 : yi);
    });

    setProfiles(loadedProfiles);

    if (t.data) {
      setTransactions(t.data.map(normalizeTransaction));
    }

    if (g.data) {
      setGoals(g.data);
    }

    if (b.data) {
      setBudgets(b.data);
    }

    if (r.data) {
      setRecurring(r.data);
    }

    if (s.data) {
      setSettlements(s.data);
    }

    if (ba.data) {
      setBankAccounts(ba.data);
    } else if (ba.error) {
      console.error("Bank accounts load failed:", ba.error);
      setBankAccounts([]);
    }

    if (st.data) {
      setSettings(st.data);
      setDark(st.data.dark_mode);
    }

    return true;
  };


  // ==========================================================
  // TOAST
  // ==========================================================

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2600);
  };


  // ==========================================================
  // REFRESH
  // ==========================================================

  const refresh = async () => {
    if (!account?.id) {
      await initialize();
      return;
    }

    const loaded = await loadAll(account.id);
    if (!loaded) {
      showToast("Could not refresh your finance account. Please try again.");
    }
  };


  // ==========================================================
  // CURRENT PERIOD DATA
  // ==========================================================

  const todayKey = localDateKey(new Date());
  const currentMonthKey = todayKey.slice(0, 7);
  const currentMonthTx = transactions.filter(
    (t) => localDateKey(t.transaction_date).slice(0, 7) === currentMonthKey
  );

  const expenseTx = currentMonthTx.filter((t) => isExpenseType(t.type));
  const incomeTx = currentMonthTx.filter((t) => t.type === "income");
  const savingsTx = currentMonthTx.filter((t) => t.type === "savings");

  const combinedExpenses = expenseTx.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const combinedIncome = incomeTx.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const combinedSavings = savingsTx.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  // Current week: Monday through Sunday.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const key = localDateKey(d);
    const value = transactions
      .filter((t) => localDateKey(t.transaction_date) === key && isExpenseType(t.type))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return {
      date: key,
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      value
    };
  });

  const weeklyExpenseTotal = weekDays.reduce((sum, d) => sum + d.value, 0);

  const monthlyExpenseTrend = Array.from({ length: 6 }, (_, index) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const value = transactions
      .filter((t) => localDateKey(t.transaction_date).slice(0, 7) === key && isExpenseType(t.type))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return {
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      value
    };
  });

  const monthlyExpenseTotal = monthlyExpenseTrend[5]?.value || 0;


  // ==========================================================
  // PROFILE STATS
  // ==========================================================

  const profileStats = (pid) => {
    const ptx = currentMonthTx.filter(
      (t) =>
        t.profile_id === pid &&
        t.type !== "shared_expense"
    );

    const personalExp = ptx
      .filter((t) => t.type === "expense")
      .reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

    const inc = ptx
      .filter((t) => t.type === "income")
      .reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

    const sav = ptx
      .filter((t) => t.type === "savings")
      .reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );


    const sharedShare = expenseTx
      .filter((t) => t.type === "shared_expense")
      .reduce((sum, t) => {

        if (t.split_type === "50_50") {
          return sum + Number(t.amount) / 2;
        }

        if (
          t.santhosh_share != null &&
          profiles[0]?.id === pid
        ) {
          return sum + Number(t.santhosh_share);
        }

        if (
          t.sindhuja_share != null &&
          profiles[1]?.id === pid
        ) {
          return sum + Number(t.sindhuja_share);
        }

        return sum;

      }, 0);


    return {
      inc,
      personalExp,
      sav,
      sharedShare,
      balance:
        inc -
        personalExp -
        sav -
        sharedShare
    };
  };


  // ==========================================================
  // LINKED BANK BALANCES
  // ==========================================================
  // The dashboard and Bank Balance page use the same source of truth:
  // transactions linked to bank_accounts through bank_account_id.
  // Closing = opening + income - expenses - savings.
  const bankStatsForApp = (bank) => {
    const bankTx = transactions.filter((t) => {
      const txDate = localDateKey(t.transaction_date);
      const openDate = localDateKey(bank.opening_date);

      return (
        t.bank_account_id === bank.id &&
        (!openDate || txDate >= openDate)
      );
    });

    const income = bankTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = bankTx
      .filter((t) => isExpenseType(t.type))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const savings = bankTx
      .filter((t) => t.type === "savings")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      income,
      expenses,
      savings,
      closing:
        Number(bank.opening_balance || 0) +
        income -
        expenses -
        savings
    };
  };

  const combinedBankBalance = bankAccounts.reduce(
    (sum, bank) => sum + bankStatsForApp(bank).closing,
    0
  );

  const profileBankBalance = (pid) =>
    bankAccounts
      .filter((bank) => bank.profile_id === pid)
      .reduce((sum, bank) => sum + bankStatsForApp(bank).closing, 0);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    setShowAccountMenu(false);
    setShowAdd(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      showToast(error.message);
      return;
    }

    setSession(null);
    setAccount(null);
    setProfiles([]);
    setTransactions([]);
    setGoals([]);
    setBudgets([]);
    setRecurring([]);
    setSettlements([]);
    setBankAccounts([]);
    setSettings(null);
    setPage("overview");
  };


  // ==========================================================
  // ACCOUNT AVATAR
  // ==========================================================

  const handleAvatarChange = async (file) => {
    if (!file || !account?.id) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Please choose an image smaller than 10 MB.");
      return;
    }

    setAvatarBusy(true);

    try {
      // Resize/compress before upload so the account picture stays small.
      const optimized = await optimizeAvatar(file);
      const path = `${account.id}/profile.webp`;

      const { error: uploadError } = await supabase.storage
        .from("account-avatars")
        .upload(path, optimized, {
          cacheControl: "3600",
          contentType: "image/webp",
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("account-avatars")
        .getPublicUrl(path);

      const url = publicData?.publicUrl
        ? `${publicData.publicUrl}?v=${Date.now()}`
        : "";

      if (!url) throw new Error("Could not create the profile picture URL.");

      const { error: dbError } = await supabase
        .from("accounts")
        .update({ avatar_url: url })
        .eq("id", account.id);

      if (dbError) throw dbError;

      setAvatarUrl(url);
      setAccount((current) =>
        current ? { ...current, avatar_url: url } : current
      );
      showToast("Profile picture updated");
    } catch (error) {
      console.error("Avatar upload failed:", error);
      showToast(
        error?.message?.includes("avatar_url")
          ? "Run the account avatar SQL in Supabase first."
          : error?.message || "Could not update profile picture."
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!account?.id || !avatarUrl) return;

    setAvatarBusy(true);

    try {
      const { error: storageError } = await supabase.storage
        .from("account-avatars")
        .remove([`${account.id}/profile.webp`]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("accounts")
        .update({ avatar_url: null })
        .eq("id", account.id);

      if (dbError) throw dbError;

      setAvatarUrl("");
      setAccount((current) =>
        current ? { ...current, avatar_url: null } : current
      );
      showToast("Profile picture removed");
    } catch (error) {
      console.error("Avatar removal failed:", error);
      showToast(error?.message || "Could not remove profile picture.");
    } finally {
      setAvatarBusy(false);
    }
  };

  // ==========================================================
  // OPEN ADD / EDIT TRANSACTION
  // ==========================================================

  const openEdit = (transaction) => {
    if (!transaction?.id) return;
    setEditingTransaction(normalizeTransaction(transaction));
    setDefaultProfile(null);
    setShowAdd(true);
  };

  const openAdd = async (pid = null) => {
    if (!account?.id) {
      showToast("Your finance account is not ready yet. Reconnecting…");
      await initialize();
      return;
    }

    setDefaultProfile(pid);
    setShowAdd(true);
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="splash">
        <div className="brand-mark">
          US<span>💜</span>
        </div>

        <p>We Spent but We Saved</p>

        <div className="loader" />
      </div>
    );
  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  if (!session) {
    return <Login onLogin={setSession} />;
  }


  // ==========================================================
  // APP
  // ==========================================================

  return (
    <div className="app-shell">

      <Sidebar
        page={page}
        setPage={setPage}
        openAdd={() => openAdd()}
        profiles={profiles}
      />


      <main className="main">

        <header className="topbar">

          <div className="mobile-brand">
            <b>US</b>
            <span>We Spent but We Saved</span>
          </div>


          <div className="top-actions">

            <button
              className="icon-btn"
              aria-label="Refresh"
              onClick={refresh}
            >
              <RefreshCw size={18} />
            </button>


            <button
              className="icon-btn"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <i />
            </button>


            <div
              className="account-menu-wrap"
              style={{ position: "relative" }}
            >
              <button
                type="button"
                className="user-chip"
                onClick={() => setShowAccountMenu((value) => !value)}
                aria-label="Open account menu"
                style={{ cursor: "pointer", border: 0 }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                    background: "#efe6ff",
                    color: "#6d28d9",
                    fontWeight: 800,
                    flexShrink: 0
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Account"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    "US"
                  )}
                </span>

                <div>
                  <b>
                    {profiles[0]?.name || settings?.person_one_name || "Santhosh"}
                    {" & "}
                    {profiles[1]?.name || settings?.person_two_name || "Sindhuja"}
                  </b>

                  <small>
                    {session?.user?.email || "Shared account"}
                  </small>
                </div>
              </button>

              {showAccountMenu && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 10px)",
                    width: 250,
                    padding: 14,
                    background: "var(--panel, #fff)",
                    border: "1px solid rgba(124, 58, 237, .15)",
                    borderRadius: 16,
                    boxShadow: "0 18px 45px rgba(20, 10, 40, .16)",
                    zIndex: 1000
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        overflow: "hidden",
                        display: "grid",
                        placeItems: "center",
                        background: "#efe6ff",
                        color: "#6d28d9",
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Account" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <UserCircle size={28} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {session?.user?.email || "Shared account"}
                      </b>
                      <small className="muted">Account</small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setPage("settings");
                    }}
                    style={{ width: "100%", justifyContent: "flex-start", marginBottom: 8 }}
                  >
                    <Camera size={17} />
                    Change profile picture
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={handleLogout}
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>


        <div className="content">

          {page === "overview" && (
            <Overview
              profiles={profiles}
              stats={profileStats}
              income={combinedIncome}
              expenses={combinedExpenses}
              savings={combinedSavings}
              balance={combinedBankBalance}
              transactions={transactions}
              openAdd={openAdd}
              weeklyExpenseTotal={weeklyExpenseTotal}
              weekDays={weekDays}
              monthlyExpenseTotal={monthlyExpenseTotal}
              monthlyExpenseTrend={monthlyExpenseTrend}
              onEdit={openEdit}
            />
          )}


          {page === "person1" && (
            <PersonDashboard
              profile={profiles[0]}
              stats={profileStats(profiles[0]?.id)}
              bankBalance={profileBankBalance(profiles[0]?.id)}
              transactions={transactions.filter(
                (t) =>
                  t.profile_id === profiles[0]?.id
              )}
              openAdd={openAdd}
              onEdit={openEdit}
            />
          )}


          {page === "person2" && (
            <PersonDashboard
              profile={profiles[1]}
              stats={profileStats(profiles[1]?.id)}
              bankBalance={profileBankBalance(profiles[1]?.id)}
              transactions={transactions.filter(
                (t) =>
                  t.profile_id === profiles[1]?.id
              )}
              openAdd={openAdd}
              onEdit={openEdit}
            />
          )}


          {page === "shared" && (
            <Shared
              profiles={profiles}
              transactions={transactions}
              settlements={settlements}
              account={account}
              refresh={refresh}
              showToast={showToast}
              onEdit={openEdit}
            />
          )}


          {page === "transactions" && (
            <Transactions
              transactions={transactions}
              profiles={profiles}
              account={account}
              refresh={refresh}
              showToast={showToast}
              onEdit={openEdit}
            />
          )}


          {page === "analytics" && (
            <Analytics
              transactions={transactions}
              profiles={profiles}
            />
          )}


          {page === "budgets" && (
            <Budgets
              budgets={budgets}
              transactions={transactions}
              account={account}
              profiles={profiles}
              refresh={refresh}
              showToast={showToast}
            />
          )}


          {page === "savings" && (
            <Savings
              goals={goals}
              transactions={transactions}
              account={account}
              profiles={profiles}
              refresh={refresh}
              showToast={showToast}
            />
          )}


          {page === "recurring" && (
            <Recurring
              items={recurring}
              account={account}
              profiles={profiles}
              refresh={refresh}
              showToast={showToast}
            />
          )}


          {page === "bankbalance" && (
            <BankBalance
              account={account}
              profiles={profiles}
              transactions={transactions}
              bankAccounts={bankAccounts}
              refresh={refresh}
              showToast={showToast}
            />
          )}

          {page === "receipts" && (
            <Receipts
              transactions={transactions}
            />
          )}


          {page === "reports" && (
            <Reports
              transactions={transactions}
              profiles={profiles}
            />
          )}


          {page === "settings" && (
            <SettingsPage
              settings={settings}
              account={account}
              profiles={profiles}
              session={session}
              avatarUrl={avatarUrl}
              avatarBusy={avatarBusy}
              onAvatarChange={handleAvatarChange}
              onAvatarRemove={handleAvatarRemove}
              onLogout={handleLogout}
              dark={dark}
              setDark={setDark}
              refresh={refresh}
              showToast={showToast}
            />
          )}

        </div>

      </main>


      {showAdd && (
        <AddTransaction
          key={editingTransaction?.id || "new"}
          account={account}
          profiles={profiles}
          bankAccounts={bankAccounts}
          defaultProfile={defaultProfile}
          editingTransaction={editingTransaction}
          onClose={() => {
            setShowAdd(false);
            setEditingTransaction(null);
          }}
          onSaved={() => {
            const wasEditing = Boolean(editingTransaction);
            setShowAdd(false);
            setEditingTransaction(null);
            refresh();
            showToast(
              wasEditing
                ? "Transaction updated successfully"
                : "Transaction added successfully"
            );
          }}
        />
      )}


      <style>{`
        .app-shell:after { content: none !important; display: none !important; }
        .mobile-nav { display: none; }
        @media (max-width: 760px) {
          .mobile-nav {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: calc(12px + env(safe-area-inset-bottom));
            z-index: 1200;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            padding: 8px;
            background: var(--panel, #fff);
            border: 1px solid var(--border, rgba(124,58,237,.14));
            border-radius: 20px;
            box-shadow: 0 16px 40px rgba(20,10,40,.16);
          }
          .mobile-nav button {
            min-width: 0;
            border: 0;
            background: transparent;
            color: var(--muted, #777);
            border-radius: 14px;
            padding: 8px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            font: inherit;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
          }
          .mobile-nav button.active {
            color: #6d28d9;
            background: rgba(124,58,237,.10);
          }
          .mobile-nav button.add {
            color: #fff;
            background: #6d28d9;
            box-shadow: 0 8px 20px rgba(109,40,217,.25);
          }
          .main { padding-bottom: 92px; }
        }
      `}</style>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={page === "overview" ? "active" : ""} onClick={() => setPage("overview")}>
          <LayoutDashboard size={19} />
          Home
        </button>
        <button className={page === "person1" ? "active" : ""} onClick={() => setPage("person1")}>
          <UserRound size={19} />
          {profiles[0]?.name || "Person 1"}
        </button>
        <button className="add" onClick={() => openAdd()} aria-label="Add transaction">
          <Plus size={21} />
          Add
        </button>
        <button className={page === "analytics" ? "active" : ""} onClick={() => setPage("analytics")}>
          <BarChart3 size={19} />
          Analytics
        </button>
        <button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>
          <Settings size={19} />
          More
        </button>
      </nav>

      {toast && (
        <div className="toast">
          <Check size={18} />
          {toast}
        </div>
      )}

    </div>
  );
}


// ============================================================
// BANK BALANCE
// ============================================================

function BankBalance({
  account,
  profiles,
  transactions,
  bankAccounts,
  refresh,
  showToast
}) {
  const [selectedProfile, setSelectedProfile] = useState("combined");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("Bank Account");
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingDate, setOpeningDate] = useState(localDateKey(new Date()));
  const [busy, setBusy] = useState(false);
  const [assigningTransactionId, setAssigningTransactionId] = useState("");

  const visibleBanks =
    selectedProfile === "combined"
      ? bankAccounts
      : bankAccounts.filter((b) => b.profile_id === selectedProfile);

  const profileName = (pid) =>
    profiles.find((p) => p.id === pid)?.name || "Person";

  const bankStats = (bank) => {
    const bankTx = transactions.filter((t) => {
      const transactionDate = localDateKey(t.transaction_date);
      const openingDate = localDateKey(bank.opening_date);

      return (
        t.bank_account_id === bank.id &&
        (!openingDate || transactionDate >= openingDate)
      );
    });

    const income = bankTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = bankTx
      .filter((t) => isExpenseType(t.type))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const savings = bankTx
      .filter((t) => t.type === "savings")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const closing =
      Number(bank.opening_balance || 0) +
      income -
      expenses -
      savings;

    return {
      income,
      expenses,
      savings,
      closing,
      transactionCount: bankTx.length
    };
  };

  const totalOpening = visibleBanks.reduce(
    (sum, b) => sum + Number(b.opening_balance || 0),
    0
  );

  const totalIncome = visibleBanks.reduce(
    (sum, b) => sum + bankStats(b).income,
    0
  );

  const totalExpenses = visibleBanks.reduce(
    (sum, b) => sum + bankStats(b).expenses,
    0
  );

  const totalSavings = visibleBanks.reduce(
    (sum, b) => sum + bankStats(b).savings,
    0
  );

  const totalClosing = visibleBanks.reduce(
    (sum, b) => sum + bankStats(b).closing,
    0
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));

  const weekStartKey = localDateKey(monday);
  const todayKey = localDateKey(today);

  const weeklySpent = transactions
    .filter((t) => {
      const date = localDateKey(t.transaction_date);
      const belongsToSelectedProfile =
        selectedProfile === "combined"
          ? true
          : bankAccounts
              .filter((b) => b.profile_id === selectedProfile)
              .some((b) => b.id === t.bank_account_id);

      return (
        belongsToSelectedProfile &&
        date >= weekStartKey &&
        date <= todayKey &&
        isExpenseType(t.type)
      );
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const currentMonthKey = todayKey.slice(0, 7);

  const monthlySpent = transactions
    .filter((t) => {
      const date = localDateKey(t.transaction_date);
      const belongsToSelectedProfile =
        selectedProfile === "combined"
          ? true
          : bankAccounts
              .filter((b) => b.profile_id === selectedProfile)
              .some((b) => b.id === t.bank_account_id);

      return (
        belongsToSelectedProfile &&
        date.slice(0, 7) === currentMonthKey &&
        isExpenseType(t.type)
      );
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const assignTransactionToBank = async (transactionId, bankId) => {
    if (!account?.id || !transactionId || !bankId) return;

    setAssigningTransactionId(transactionId);

    try {
      const selectedBank = bankAccounts.find((b) => b.id === bankId);
      const transaction = transactions.find((t) => t.id === transactionId);

      if (!selectedBank) throw new Error("Selected bank account was not found.");
      if (!transaction) throw new Error("Transaction was not found.");

      if (
        transaction.profile_id &&
        transaction.profile_id !== selectedBank.profile_id
      ) {
        throw new Error("This bank belongs to a different person.");
      }

      if (
        transaction.type === "shared_expense" &&
        transaction.shared_paid_by &&
        transaction.shared_paid_by !== selectedBank.profile_id
      ) {
        throw new Error("A shared expense must use the payer's bank.");
      }

      const { error } = await supabase
        .from("transactions")
        .update({ bank_account_id: bankId })
        .eq("id", transactionId)
        .eq("account_id", account.id);

      if (error) throw error;

      await refresh();
      showToast("Transaction linked to bank successfully");
    } catch (error) {
      console.error("Bank assignment failed:", error);
      showToast(error?.message || "Could not link transaction to bank.");
    } finally {
      setAssigningTransactionId("");
    }
  };

  const saveBank = async (e) => {
    e.preventDefault();

    if (!account?.id) {
      showToast("Account is not ready.");
      return;
    }

    if (selectedProfile === "combined") {
      showToast("Select Santhosh or Sindhuja before adding a bank.");
      return;
    }

    const name = bankName.trim();

    if (!name) {
      showToast("Enter the bank name.");
      return;
    }

    const opening = Number(openingBalance || 0);

    if (!Number.isFinite(opening) || opening < 0) {
      showToast("Enter a valid opening balance.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase
        .from("bank_accounts")
        .insert({
          account_id: account.id,
          profile_id: selectedProfile,
          bank_name: name,
          account_type: accountType.trim() || "Bank Account",
          opening_balance: opening,
          opening_date: openingDate || todayKey
        });

      if (error) {
        showToast(error.message);
        return;
      }

      setBankName("");
      setAccountType("Bank Account");
      setOpeningBalance("");
      setOpeningDate(todayKey);

      await refresh();
      showToast(`${name} added successfully`);
    } catch (error) {
      console.error("Bank creation failed:", error);
      showToast(error?.message || "Could not add bank.");
    } finally {
      setBusy(false);
    }
  };

  const editOpeningBalance = async (bank) => {
    const value = window.prompt(
      `Opening balance for ${bank.bank_name}`,
      String(bank.opening_balance ?? 0)
    );

    if (value === null) return;

    const opening = Number(value);

    if (!Number.isFinite(opening) || opening < 0) {
      showToast("Enter a valid non-negative opening balance.");
      return;
    }

    const date = window.prompt(
      `Opening date for ${bank.bank_name} (YYYY-MM-DD)`,
      localDateKey(bank.opening_date) || todayKey
    );

    if (date === null) return;

    const { error } = await supabase
      .from("bank_accounts")
      .update({
        opening_balance: opening,
        opening_date: date
      })
      .eq("id", bank.id)
      .eq("account_id", account.id);

    if (error) {
      showToast(error.message);
      return;
    }

    await refresh();
    showToast(`${bank.bank_name} opening balance updated`);
  };

  const deleteBank = async (bank) => {
    const linked = transactions.some(
      (t) => t.bank_account_id === bank.id
    );

    if (linked) {
      showToast(
        "This bank has transactions linked to it. Reassign those transactions before deleting the bank."
      );
      return;
    }

    if (!window.confirm(`Delete ${bank.bank_name}?`)) return;

    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", bank.id)
      .eq("account_id", account.id);

    if (error) {
      showToast(error.message);
      return;
    }

    await refresh();
    showToast("Bank account deleted");
  };

  return (
    <>
      <PageHead
        eyebrow="BANKS & BALANCES"
        title="Bank Balance"
        desc="Every linked transaction changes its bank automatically. Closing balance = opening + income - expenses - savings."
      />

      <div className="segmented" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={selectedProfile === "combined" ? "selected" : ""}
          onClick={() => setSelectedProfile("combined")}
        >
          Combined
        </button>

        {profiles.slice(0, 2).map((p) => (
          <button
            type="button"
            key={p.id}
            className={selectedProfile === p.id ? "selected" : ""}
            onClick={() => setSelectedProfile(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<Wallet />}
          label="Opening Balance"
          value={money(totalOpening)}
          sub="Selected view"
        />

        <StatCard
          icon={<ArrowDownRight />}
          label="This Week Spent"
          value={money(weeklySpent)}
          sub="Monday to today"
          up={false}
        />

        <StatCard
          icon={<ArrowDownRight />}
          label="This Month Spent"
          value={money(monthlySpent)}
          sub="Current month"
          up={false}
        />

        <StatCard
          icon={<Wallet />}
          label="Closing Balance"
          value={money(totalClosing)}
          sub="Opening + income − expenses − savings"
        />
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Add bank account</h2>
              <span>
                {selectedProfile === "combined"
                  ? "Choose a person first"
                  : `Add a bank for ${profileName(selectedProfile)}`}
              </span>
            </div>
          </div>

          <form className="inline-form" onSubmit={saveBank}>
            <input
              placeholder="Bank name (e.g. Bank of Baroda)"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              disabled={selectedProfile === "combined" || busy}
              required
            />

            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              disabled={selectedProfile === "combined" || busy}
            >
              <option>Bank Account</option>
              <option>Savings Account</option>
              <option>Current Account</option>
              <option>Salary Account</option>
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Opening balance"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              disabled={selectedProfile === "combined" || busy}
              required
            />

            <input
              type="date"
              value={openingDate}
              onChange={(e) => setOpeningDate(e.target.value)}
              disabled={selectedProfile === "combined" || busy}
              required
            />

            <button
              className="primary"
              type="submit"
              disabled={selectedProfile === "combined" || busy}
            >
              <Plus size={17} />
              {busy ? "Adding…" : "Add Bank"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Selected view summary</h2>
              <span>
                {selectedProfile === "combined"
                  ? "Both people"
                  : profileName(selectedProfile)}
              </span>
            </div>
          </div>

          <div className="mini-grid">
            <div>
              <small>Income</small>
              <b className="positive">{money(totalIncome)}</b>
            </div>

            <div>
              <small>Expenses</small>
              <b className="negative">{money(totalExpenses)}</b>
            </div>

            <div>
              <small>Savings</small>
              <b>{money(totalSavings)}</b>
            </div>

            <div>
              <small>Closing</small>
              <b>{money(totalClosing)}</b>
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const unassigned = transactions.filter((t) => {
          if (t.bank_account_id) return false;

          if (selectedProfile === "combined") return true;

          if (t.type === "shared_expense") {
            return t.shared_paid_by === selectedProfile;
          }

          return t.profile_id === selectedProfile;
        });

        if (!unassigned.length) return null;

        const availableForTransaction = (transaction) =>
          bankAccounts.filter((bank) => {
            if (transaction.type === "shared_expense") {
              return bank.profile_id === transaction.shared_paid_by;
            }

            return bank.profile_id === transaction.profile_id;
          });

        return (
          <div className="panel" style={{ marginTop: 18 }}>
            <div className="panel-head">
              <div>
                <h2>Transactions waiting for a bank</h2>
                <span>
                  Existing transactions without a bank will not affect a bank balance until you link them.
                </span>
              </div>
            </div>

            <div className="list-cards">
              {unassigned.map((t) => {
                const options = availableForTransaction(t);
                const person =
                  t.type === "shared_expense"
                    ? profileName(t.shared_paid_by)
                    : profileName(t.profile_id);

                return (
                  <div className="recurring-row" key={t.id}>
                    <div className="tx-icon">
                      {t.type === "income" ? "₹" : t.type === "savings" ? "🏦" : "↘"}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <b>{t.merchant || t.category || "Transaction"}</b>
                      <span>
                        {person} · {localDateKey(t.transaction_date)}
                      </span>
                    </div>

                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <strong>{money(t.amount)}</strong>
                    </div>

                    <select
                      value=""
                      disabled={
                        assigningTransactionId === t.id ||
                        options.length === 0
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          assignTransactionToBank(t.id, e.target.value);
                        }
                      }}
                      aria-label={`Select bank for ${t.merchant || t.category || "transaction"}`}
                    >
                      <option value="">
                        {options.length ? "Select bank" : "No bank available"}
                      </option>
                      {options.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bank_name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <div>
            <h2>
              {selectedProfile === "combined"
                ? "All bank accounts"
                : `${profileName(selectedProfile)}'s bank accounts`}
            </h2>
            <span>
              Each transaction reduces or increases the selected bank automatically.
            </span>
          </div>
        </div>

        {visibleBanks.length ? (
          <div className="list-cards">
            {visibleBanks.map((bank) => {
              const stats = bankStats(bank);

              return (
                <div className="recurring-row" key={bank.id}>
                  <div className="tx-icon">
                    <Landmark size={20} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <b>{bank.bank_name}</b>
                    <span>
                      {profileName(bank.profile_id)} ·{" "}
                      {bank.account_type || "Bank Account"}
                    </span>
                    <small>
                      Opening {money(bank.opening_balance)} ·{" "}
                      {bank.opening_date}
                    </small>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong>{money(stats.closing)}</strong>
                    <small style={{ display: "block" }}>
                      {stats.transactionCount} transactions
                    </small>
                  </div>

                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => editOpeningBalance(bank)}
                    title="Edit opening balance"
                    aria-label={`Edit ${bank.bank_name} opening balance`}
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => deleteBank(bank)}
                    title="Delete bank"
                    aria-label={`Delete ${bank.bank_name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            text={
              selectedProfile === "combined"
                ? "No bank accounts added yet."
                : `No bank accounts added for ${profileName(selectedProfile)}.`
            }
          />
        )}
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <div>
            <h2>How the balance works</h2>
            <span>Calculated from your transaction history</span>
          </div>
        </div>

        <p className="muted" style={{ lineHeight: 1.7 }}>
          <b>Closing balance = Opening balance + Income − Expenses − Savings.</b>
          {" "}Every transaction is linked to one bank. The dashboard reads the same bank totals, so adding, editing or deleting a transaction updates the bank balance and dashboard automatically.
          Shared expenses are deducted from the bank belonging to the person who paid.
        </p>
      </div>
    </>
  );
}

// ============================================================
// LOGIN
// ============================================================

function Login({ onLogin }) {

  const [email, setEmail] =
    useState("tarasaifam@gmail.com");

  const [password, setPassword] =
    useState("");

  const [show, setShow] =
    useState(false);

  const [remember, setRemember] =
    useState(true);

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);


  const login = async (e) => {

    e.preventDefault();

    setBusy(true);
    setError("");

    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });


    if (error) {
      setError(error.message);
    } else {
      onLogin(data.session);
    }

    setBusy(false);
  };


  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          US <span>💜</span>
        </div>

        <h1>
          We Spent but We Saved
        </h1>

        <p className="muted">
          Your money, together.
        </p>


        <form onSubmit={login}>

          <label>
            Email

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              type="email"
              required
            />
          </label>


          <label>
            Password

            <div className="password-wrap">

              <input
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                type={
                  show
                    ? "text"
                    : "password"
                }
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShow(!show)
                }
              >
                {show ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>
          </label>


          <label className="check">

            <input
              type="checkbox"
              checked={remember}
              onChange={(e) =>
                setRemember(e.target.checked)
              }
            />

            Remember me

          </label>


          {error && (
            <div className="error">
              {error}
            </div>
          )}


          <button
            className="primary wide"
            disabled={busy}
          >
            {busy
              ? "Signing in…"
              : "Login"}
          </button>

        </form>


        <div className="private-note">
          🔒 Private shared account
        </div>

      </div>

    </div>
  );
}


// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({
  page,
  setPage,
  openAdd,
  profiles
}) {

  const items = [
    [
      "overview",
      "Overview",
      LayoutDashboard
    ],

    [
      "person1",
      profiles[0]?.name || "Santhosh",
      UserRound
    ],

    [
      "person2",
      profiles[1]?.name || "Sindhuja",
      UserRound
    ],

    [
      "shared",
      "Shared",
      UsersRound
    ],

    [
      "transactions",
      "Transactions",
      Receipt
    ],

    [
      "analytics",
      "Analytics",
      BarChart3
    ],

    [
      "budgets",
      "Budgets",
      Target
    ],

    [
      "savings",
      "Savings Goals",
      PiggyBank
    ],

    [
      "recurring",
      "Recurring",
      Repeat2
    ],

    [
      "bankbalance",
      "Bank Balance",
      Landmark
    ],

    [
      "receipts",
      "Receipts",
      Receipt
    ],

    [
      "reports",
      "Reports",
      FileText
    ],

    [
      "settings",
      "Settings",
      Settings
    ]
  ];


  return (
    <aside className="sidebar">

      <div className="side-brand">

        <strong>
          US <span>💜</span>
        </strong>

        <small>
          We Spent but We Saved
        </small>

      </div>


      <nav>

        {items.map(
          ([id, label, I]) => (
            <button
              key={id}
              className={
                page === id
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(id)
              }
            >
              <I size={18} />
              {label}
            </button>
          )
        )}

      </nav>


      <button
        className="side-add"
        onClick={openAdd}
      >
        <Plus size={19} />
        Add Transaction
      </button>


      <div className="side-footer">
        <small>
          Your money, together.
        </small>
      </div>

    </aside>
  );
}


// ============================================================
// PAGE HEAD
// ============================================================

function PageHead({
  eyebrow,
  title,
  desc,
  action
}) {

  return (
    <div className="page-head">

      <div>

        <div className="eyebrow">
          {eyebrow}
        </div>

        <h1>{title}</h1>

        {desc && (
          <p>{desc}</p>
        )}

      </div>

      {action}

    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  label,
  value,
  sub,
  up
}) {

  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>

        <span>{label}</span>

        <strong>{value}</strong>

        {sub && (
          <small
            className={
              up === false
                ? "negative"
                : "positive"
            }
          >
            {sub}
          </small>
        )}

      </div>

    </div>
  );
}


// ============================================================
// OVERVIEW
// ============================================================

function Overview({
  profiles,
  stats,
  income,
  expenses,
  savings,
  balance,
  transactions,
  openAdd,
  weeklyExpenseTotal,
  weekDays,
  monthlyExpenseTotal,
  monthlyExpenseTrend,
  onEdit
}) {

  const cat = {};

  transactions
    .filter(
      (t) =>
        t.type === "expense" ||
        t.type === "shared_expense"
    )
    .forEach((t) => {
      cat[t.category || "Other"] =
        (cat[t.category || "Other"] || 0) +
        Number(t.amount);
    });


  const chart = Object.entries(cat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value]) => ({
      name,
      value
    }));


  return (
    <>
      <PageHead
        eyebrow="OVERVIEW"
        title="Your money, together."
        desc="A clear view of both people and everything you share."
        action={
          <button
            className="primary"
            onClick={() => openAdd()}
          >
            <Plus size={18} />
            Add Transaction
          </button>
        }
      />


      <div className="stats-grid">

        <StatCard
          icon={<Wallet />}
          label="Combined Income"
          value={money(income)}
          sub="This month"
        />

        <StatCard
          icon={<ArrowDownRight />}
          label="Combined Expenses"
          value={money(expenses)}
          sub="This month"
        />

        <StatCard
          icon={<PiggyBank />}
          label="Combined Savings"
          value={money(savings)}
          sub="This month"
        />

        <StatCard
          icon={<ArrowUpRight />}
          label="Available Balance"
          value={money(balance)}
          sub="Linked bank balances"
        />

      </div>


      <div className="people-grid">

        {profiles.map((p) => {

          const s = stats(p.id);

          return (
            <div
              className="person-card"
              key={p.id}
            >

              <div className="person-top">

                <div className="avatar">
                  {p.name[0]}
                </div>

                <div>
                  <h3>{p.name}</h3>
                  <span>
                    Personal dashboard
                  </span>
                </div>

                <ArrowRight size={18} />

              </div>


              <div className="mini-grid">

                <div>
                  <small>Income</small>
                  <b>{money(s.inc)}</b>
                </div>

                <div>
                  <small>Expenses</small>
                  <b>
                    {money(
                      s.personalExp +
                      s.sharedShare
                    )}
                  </b>
                </div>

                <div>
                  <small>Savings</small>
                  <b>{money(s.sav)}</b>
                </div>

                <div>
                  <small>Balance</small>
                  <b>{money(s.balance)}</b>
                </div>

              </div>

            </div>
          );
        })}

      </div>


      <div className="two-col" style={{ marginTop: 18 }}>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Weekly expenses</h2>
              <span>Monday to Sunday</span>
            </div>
            <strong style={{ fontSize: 20 }}>{money(weeklyExpenseTotal)}</strong>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={weekDays}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="value" name="Expenses" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Monthly expenses</h2>
              <span>Current month + previous 5 months</span>
            </div>
            <strong style={{ fontSize: 20 }}>{money(monthlyExpenseTotal)}</strong>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlyExpenseTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Line type="monotone" dataKey="value" name="Expenses" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>


      <div className="two-col">

        <div className="panel">

          <div className="panel-head">

            <div>
              <h2>
                Spending by category
              </h2>

              <span>
                This month
              </span>
            </div>

          </div>


          {chart.length ? (

            <ResponsiveContainer
              width="100%"
              height={280}
            >

              <PieChart>

                <Pie
                  data={chart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={2}
                >

                  {chart.map(
                    (entry, i) => (
                      <Cell
                        key={entry.name || i}
                        fill={
                          ANALYTICS_COLORS[
                            i % ANALYTICS_COLORS.length
                          ]
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip
                  formatter={(v) =>
                    money(v)
                  }
                />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          ) : (

            <Empty
              text="Add a few expenses to see your spending breakdown."
              onAdd={openAdd}
            />

          )}

        </div>


        <div className="panel">

          <div className="panel-head">

            <div>
              <h2>
                Recent transactions
              </h2>

              <span>
                Latest activity
              </span>
            </div>

          </div>

          <TransactionList
            transactions={transactions.slice(
              0,
              6
            )}
            profiles={profiles}
            onEdit={onEdit}
          />

        </div>

      </div>
    </>
  );
}


// ============================================================
// PERSON DASHBOARD
// ============================================================

function PersonDashboard({
  profile,
  stats,
  bankBalance,
  transactions,
  openAdd,
  onEdit
}) {

  if (!profile) {
    return (
      <Empty text="Profile not found." />
    );
  }


  return (
    <>
      <PageHead
        eyebrow="PERSONAL DASHBOARD"
        title={`${profile.name}'s Dashboard`}
        desc="Your personal income, spending, savings and balance."
        action={
          <button
            className="primary"
            onClick={() =>
              openAdd(profile.id)
            }
          >
            <Plus size={18} />
            Add Transaction
          </button>
        }
      />


      <div className="stats-grid">

        <StatCard
          icon={<ArrowDownRight />}
          label="Income"
          value={money(stats.inc)}
          sub="This month"
        />

        <StatCard
          icon={<Receipt />}
          label="Personal Expenses"
          value={money(stats.personalExp)}
          sub="This month"
        />

        <StatCard
          icon={<PiggyBank />}
          label="Savings"
          value={money(stats.sav)}
          sub="This month"
        />

        <StatCard
          icon={<Wallet />}
          label="Available Balance"
          value={money(bankBalance)}
          sub="Linked bank balances"
        />

      </div>


      <div className="panel">

        <div className="panel-head">

          <div>

            <h2>
              Recent transactions
            </h2>

            <span>
              Only {profile.name}'s personal entries
            </span>

          </div>

        </div>


        <TransactionList
          transactions={transactions.slice(
            0,
            12
          )}
          profiles={[profile]}
        />

      </div>
    </>
  );
}


// ============================================================
// SHARED
// ============================================================

function Shared({
  profiles,
  transactions,
  settlements,
  account,
  refresh,
  showToast
}) {

  const shared =
    transactions.filter(
      (t) =>
        t.type === "shared_expense"
    );

  const total = shared.reduce(
    (sum, t) =>
      sum + Number(t.amount),
    0
  );


  const paid = {};

  shared.forEach((t) => {

    paid[t.shared_paid_by] =
      (paid[t.shared_paid_by] || 0) +
      Number(t.amount);

  });


  const half = total / 2;

  const diff =
    (paid[profiles[0]?.id] || 0) -
    half;


  const owing =
    diff > 0
      ? profiles[1]
      : profiles[0];

  const receiver =
    diff > 0
      ? profiles[0]
      : profiles[1];

  const amount =
    Math.abs(diff);


  return (
    <>
      <PageHead
        eyebrow="TOGETHER"
        title="Shared Expenses"
        desc="Rent, groceries, trips and everything you both use."
      />


      <div className="stats-grid">

        <StatCard
          icon={<UsersRound />}
          label="Shared this month"
          value={money(total)}
          sub={`${shared.length} expenses`}
        />

        <StatCard
          icon={<Wallet />}
          label={
            amount
              ? "Settlement balance"
              : "Settled"
          }
          value={money(amount)}
          sub={
            amount
              ? `${owing?.name} owes ${receiver?.name}`
              : "No balance due"
          }
        />

      </div>


      <div className="two-col">

        <div className="panel">

          <div className="panel-head">

            <div>

              <h2>
                Shared activity
              </h2>

              <span>
                Paid by and split details
              </span>

            </div>

          </div>


          <TransactionList
            transactions={shared.slice(
              0,
              15
            )}
            profiles={profiles}
          />

        </div>


        <div className="panel">

          <div className="panel-head">

            <div>

              <h2>
                Settlement
              </h2>

              <span>
                50/50 calculation
              </span>

            </div>

          </div>


          {amount ? (

            <div className="settlement">

              <div className="settle-people">

                <span>
                  {owing?.name}
                </span>

                <ArrowRight />

                <span>
                  {receiver?.name}
                </span>

              </div>


              <strong>
                {owing?.name} owes{" "}
                {receiver?.name}{" "}
                {money(amount)}
              </strong>


              <button
                className="primary"
                onClick={async () => {

                  const {
                    error
                  } =
                    await supabase
                      .from("settlements")
                      .insert({
                        account_id:
                          account.id,
                        paid_by:
                          receiver.id,
                        owed_by:
                          owing.id,
                        amount,
                        status:
                          "settled"
                      });


                  if (error) {
                    showToast(
                      error.message
                    );
                  } else {

                    refresh();

                    showToast(
                      "Settlement marked as settled"
                    );

                  }

                }}
              >
                Mark as Settled
              </button>

            </div>

          ) : (

            <Empty text="You're all settled up 💜" />

          )}


          <h3 className="section-title">
            Settlement history
          </h3>


          {settlements
            .slice(0, 6)
            .map((s) => (

              <div
                className="history-row"
                key={s.id}
              >

                <span>
                  {s.status ===
                  "settled"
                    ? "✓"
                    : "•"}{" "}
                  {money(s.amount)}
                </span>

                <small>
                  {s.status}
                </small>

              </div>

            ))}

        </div>

      </div>
    </>
  );
}


// ============================================================
// TRANSACTION LIST
// ============================================================

function TransactionList({
  transactions,
  profiles,
  onEdit
}) {

  if (!transactions.length) {
    return (
      <div className="empty-small">
        Nothing here yet 💜
      </div>
    );
  }


  return (
    <div className="tx-list">

      {transactions.map((t) => {

        const I =
          iconFor(t.category);

        const p =
          profiles.find(
            (x) =>
              x.id === t.profile_id
          );


        return (
          <div
            className="tx-row"
            key={t.id}
          >

            <div className="tx-icon">
              <I size={18} />
            </div>


            <div className="tx-main">

              <b>
                {t.merchant ||
                  t.category ||
                  t.type}
              </b>

              <span>
                {t.type ===
                "shared_expense"
                  ? "🤝 Shared"
                  : p?.name ||
                    "Account"}{" "}
                ·{" "}
                {t.transaction_date}
              </span>

            </div>


            <strong
              className={
                t.type === "income" ||
                t.type === "savings"
                  ? "positive"
                  : "negative"
              }
            >

              {t.type === "income"
                ? "+"
                : t.type === "savings"
                ? "🏦 "
                : "−"}

              {money(t.amount)}

            </strong>

            {onEdit && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => onEdit(t)}
                aria-label="Edit transaction"
                title="Edit transaction"
              >
                ✎
              </button>
            )}

          </div>
        );

      })}

    </div>
  );
}


// ============================================================
// EMPTY
// ============================================================

function Empty({
  text = "Nothing here yet 💜",
  onAdd
}) {

  return (
    <div className="empty">

      <div className="empty-mark">
        💜
      </div>

      <h3>{text}</h3>

      {onAdd && (
        <button
          className="primary"
          onClick={onAdd}
        >
          <Plus size={17} />
          Add Transaction
        </button>
      )}

    </div>
  );
}


// ============================================================
// ADD TRANSACTION
// ============================================================

function AddTransaction({
  account,
  profiles,
  bankAccounts,
  defaultProfile,
  editingTransaction,
  onClose,
  onSaved
}) {
  const [type, setType] = useState(
    editingTransaction?.type === "shared_expense" ? "expense" : (editingTransaction?.type || "expense")
  );
  const [profile, setProfile] = useState(
    editingTransaction
      ? (editingTransaction.type === "shared_expense" ? "shared" : editingTransaction.profile_id || "")
      : (defaultProfile || "")
  );
  const [amount, setAmount] = useState(editingTransaction ? String(editingTransaction.amount ?? "") : "");
  const [category, setCategory] = useState(editingTransaction?.category || "Food");
  const [payment, setPayment] = useState(editingTransaction?.payment_method || "UPI");
  const [bankAccount, setBankAccount] = useState(editingTransaction?.bank_account_id || "");
  const [date, setDate] = useState(
    editingTransaction?.transaction_date || new Date().toISOString().slice(0, 10)
  );
  const [merchant, setMerchant] = useState(editingTransaction?.merchant || "");
  const [notes, setNotes] = useState(editingTransaction?.notes || "");
  const [paidBy, setPaidBy] = useState(editingTransaction?.shared_paid_by || "");
  const [split, setSplit] = useState(editingTransaction?.split_type || "50_50");
  const [s1, setS1] = useState(editingTransaction?.santhosh_share != null ? String(editingTransaction.santhosh_share) : "");
  const [s2, setS2] = useState(editingTransaction?.sindhuja_share != null ? String(editingTransaction.sindhuja_share) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // IMPORTANT: Always render exactly two personal choices + Shared.
  // The previous version hid the people whenever Supabase returned no
  // profile rows, which is why the modal showed only Shared.
  //
  // We use stable UI keys (person1/person2) when a database UUID is not
  // available yet. On save, those profiles are created/recovered in
  // Supabase and the real UUID is used for the transaction.
  const dbProfiles = profiles.filter((p) => p?.id).slice(0, 2);
  const pickerProfiles = [
    {
      key: "person1",
      id: dbProfiles[0]?.id || "person1",
      name: dbProfiles[0]?.name || "Santhosh"
    },
    {
      key: "person2",
      id: dbProfiles[1]?.id || "person2",
      name: dbProfiles[1]?.name || "Sindhuja"
    }
  ];

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type === "shared_expense" ? "expense" : editingTransaction.type || "expense");
      setProfile(editingTransaction.type === "shared_expense" ? "shared" : editingTransaction.profile_id || "");
      setAmount(String(editingTransaction.amount ?? ""));
      setCategory(editingTransaction.category || "Food");
      setPayment(editingTransaction.payment_method || "UPI");
      setBankAccount(editingTransaction.bank_account_id || "");
      setDate(localDateKey(editingTransaction.transaction_date) || new Date().toISOString().slice(0, 10));
      setMerchant(editingTransaction.merchant || "");
      setNotes(editingTransaction.notes || "");
      setPaidBy(editingTransaction.shared_paid_by || "");
      setSplit(editingTransaction.split_type || "50_50");
      setS1(editingTransaction.santhosh_share != null ? String(editingTransaction.santhosh_share) : "");
      setS2(editingTransaction.sindhuja_share != null ? String(editingTransaction.sindhuja_share) : "");
      setError("");
      return;
    }

    if (defaultProfile) {
      const exists = pickerProfiles.some((p) => p.id === defaultProfile);
      if (exists) setProfile(defaultProfile);
    }
  }, [defaultProfile, profiles, editingTransaction]);

  useEffect(() => {
    // Shared expense needs a real payer UUID. If profiles are already
    // loaded, default to Person 1; otherwise resolve it during save.
    if (!paidBy && dbProfiles[0]?.id) {
      setPaidBy(dbProfiles[0].id);
    }
  }, [profiles, paidBy]);

  const selectPerson = (value) => {
    // This is a single-select control: there is only one `profile` value.
    setProfile(value);
    setError("");
  };

  const ensureProfile = async (index) => {
    const existing = dbProfiles[index];
    if (existing?.id) return existing;

    const fallbackName = pickerProfiles[index].name;
    const { data, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        { account_id: account.id, name: fallbackName },
        { onConflict: "account_id,name" }
      )
      .select("*")
      .single();

    if (profileError) throw profileError;
    return data;
  };

  const availableBanks = bankAccounts.filter((b) => {
    if (profile === "shared" && type === "expense") {
      return b.profile_id === paidBy;
    }
    if (profile === "shared") {
      return true;
    }
    return b.profile_id === profile;
  });

  useEffect(() => {
    if (bankAccount && availableBanks.some((b) => b.id === bankAccount)) return;
    if (availableBanks.length === 1) {
      setBankAccount(availableBanks[0].id);
    } else if (!availableBanks.length) {
      setBankAccount("");
    }
  }, [profile, type, paidBy, bankAccounts]);

  const save = async (e) => {
    e.preventDefault();
    setError("");

    if (!account?.id) {
      setError("Account not ready. Please refresh and try again.");
      return;
    }

    const total = Number(amount);
    if (!Number.isFinite(total) || total <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!profile) {
      setError("Please select exactly one: Santhosh, Sindhuja or Shared.");
      return;
    }

    const shared = profile === "shared";

    if (!bankAccount) {
      setError("Please select the bank account used for this transaction.");
      return;
    }

    // Resolve the selected person's real Supabase UUID. This makes the
    // picker work even when the account is an older account whose profile
    // rows have not been created yet.
    let selectedProfileId = profile;
    let resolvedPaidBy = paidBy;

    try {
      if (!shared) {
        const selectedIndex = profile === pickerProfiles[0].id ? 0 : 1;
        const selected = await ensureProfile(selectedIndex);
        selectedProfileId = selected.id;
      }

      if (shared && type === "expense") {
        if (!resolvedPaidBy) {
          const first = await ensureProfile(0);
          resolvedPaidBy = first.id;
        } else if (resolvedPaidBy === "person1") {
          resolvedPaidBy = (await ensureProfile(0)).id;
        } else if (resolvedPaidBy === "person2") {
          resolvedPaidBy = (await ensureProfile(1)).id;
        }

        if (!resolvedPaidBy) {
          setError("Please select who paid for the shared expense.");
          return;
        }
      }
    } catch (profileError) {
      console.error("Profile resolution failed:", profileError);
      setError(profileError?.message || "Could not prepare the two profiles.");
      return;
    }

    if (shared && type === "expense") {
      if (split === "custom") {
        const share1 = Number(s1 || 0);
        const share2 = Number(s2 || 0);

        if (share1 <= 0 || share2 <= 0) {
          setError("Enter both people's shares.");
          return;
        }

        if (Math.abs(share1 + share2 - total) > 0.01) {
          setError("Custom shares must add up to the total amount.");
          return;
        }
      }
    }

    // The finance schema supports personal income/savings and shared
    // expenses. For Shared + Savings we store a savings contribution
    // with no profile owner, which represents the shared pool.
    // Shared + Income is also stored as combined income (profile_id null).
    const payload = {
      account_id: account.id,
      profile_id: shared ? null : selectedProfileId,
      type: shared && type === "expense" ? "shared_expense" : type,
      amount: total,
      category: type === "savings" ? "Savings" : category,
      payment_method: payment,
      bank_account_id: bankAccount,
      transaction_date: date,
      merchant: merchant.trim() || null,
      notes: notes.trim() || null,
      shared_paid_by: shared && type === "expense" ? resolvedPaidBy : null,
      split_type: shared && type === "expense" ? split : null,
      santhosh_share:
        shared && type === "expense"
          ? split === "50_50"
            ? Number((total / 2).toFixed(2))
            : Number(s1 || 0)
          : null,
      sindhuja_share:
        shared && type === "expense"
          ? split === "50_50"
            ? Number((total / 2).toFixed(2))
            : Number(s2 || 0)
          : null
    };

    setBusy(true);

    try {
      let saveError = null;

      if (editingTransaction?.id) {
        const { error: updateError } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingTransaction.id)
          .eq("account_id", account.id);
        saveError = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("transactions")
          .insert(payload);
        saveError = insertError;
      }

      if (saveError) {
        console.error(editingTransaction ? "Transaction update failed:" : "Transaction insert failed:", saveError, payload);
        setError(saveError.message || "Could not save the transaction.");
        return;
      }

      onSaved();
    } catch (err) {
      console.error("Transaction save failed:", err);
      setError(err?.message || "Could not save the transaction.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="eyebrow">QUICK ENTRY</div>
            <h2>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        <div className="segmented">
          {[
            ["expense", "💸 Expense"],
            ["income", "💰 Income"],
            ["savings", "🏦 Savings"]
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={type === value ? "selected" : ""}
              onClick={() => {
                setType(value);
                setError("");
                // Income belongs to one person, not the shared pool.
                if (value === "income" && profile === "shared") {
                  setProfile(
                    defaultProfile ||
                    dbProfiles[0]?.id ||
                    "person1"
                  );
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={save}>
          <div className="field-label">Who is this for?</div>

          <div className="person-picker">
            {pickerProfiles.map((p, index) => {
              const selected = profile === p.id;

              return (
                <button
                  type="button"
                  key={p.key}
                  className={`person-option ${selected ? "selected" : ""}`}
                  onClick={() => selectPerson(p.id)}
                  aria-pressed={selected}
                >
                  <span className="picker-avatar">
                    {p.name?.[0] || (index === 0 ? "S" : "S")}
                  </span>
                  <span>
                    <b>{p.name}</b>
                    <small>Personal</small>
                  </span>
                  {selected && <Check size={17} />}
                </button>
              );
            })}

            <button
              type="button"
              className={`person-option ${profile === "shared" ? "selected" : ""}`}
              onClick={() => selectPerson("shared")}
              aria-pressed={profile === "shared"}
            >
              <span className="picker-avatar">🤝</span>
              <span>
                <b>Shared</b>
                <small>Both people</small>
              </span>
              {profile === "shared" && <Check size={17} />}
            </button>
          </div>

          <div className="form-grid">
            <label>
              Amount (₹)
              <input
                autoFocus
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            Bank account
            <select
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              required
            >
              <option value="">Select bank</option>
              {availableBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bank_name} · {b.account_type || "Bank Account"}
                </option>
              ))}
            </select>
            {!availableBanks.length && (
              <small className="muted">
                No bank is configured for this selection. Open Bank Balance and add a bank first.
              </small>
            )}
          </label>

          {type === "expense" && (
            <div className="form-grid">
              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Food</option>
                  <option>Rent & Home</option>
                  <option>Groceries</option>
                  <option>Transport</option>
                  <option>Shopping</option>
                  <option>Entertainment</option>
                  <option>Mobile & Internet</option>
                  <option>Fitness</option>
                  <option>Education</option>
                  <option>Health</option>
                  <option>EMI / Loan</option>
                  <option>Gifts</option>
                  <option>Travel</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Payment method
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                >
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Debit Card</option>
                  <option>Credit Card</option>
                  <option>Bank Transfer</option>
                  <option>Wallet</option>
                  <option>Other</option>
                </select>
              </label>
            </div>
          )}

          {type !== "expense" && (
            <div className="form-grid">
              <label>
                {type === "income" ? "Income source" : "Payment method"}
                {type === "income" ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Salary</option>
                    <option>Freelance</option>
                    <option>Business</option>
                    <option>Bonus</option>
                    <option>Allowance</option>
                    <option>Interest</option>
                    <option>Other</option>
                  </select>
                ) : (
                  <select
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                  >
                    <option>UPI</option>
                    <option>Cash</option>
                    <option>Debit Card</option>
                    <option>Credit Card</option>
                    <option>Bank Transfer</option>
                    <option>Wallet</option>
                    <option>Other</option>
                  </select>
                )}
              </label>

              <label>
                {type === "income" ? "Payment method" : "Notes"}
                {type === "income" ? (
                  <select
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                  >
                    <option>UPI</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                    <option>Other</option>
                  </select>
                ) : (
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional"
                  />
                )}
              </label>
            </div>
          )}

          {profile === "shared" && type === "expense" && (
            <>
              <div className="form-grid">
                <label>
                  Paid by
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    required
                  >
                    <option value="">Select who paid</option>
                    {pickerProfiles.map((p) => (
                      <option key={p.key} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Split
                  <select
                    value={split}
                    onChange={(e) => setSplit(e.target.value)}
                  >
                    <option value="50_50">50 / 50</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
              </div>

              {split === "custom" && (
                <div className="form-grid">
                  <label>
                    {pickerProfiles[0]?.name || "Santhosh"} share
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={s1}
                      onChange={(e) => setS1(e.target.value)}
                    />
                  </label>
                  <label>
                    {pickerProfiles[1]?.name || "Sindhuja"} share
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={s2}
                      onChange={(e) => setS2(e.target.value)}
                    />
                  </label>
                </div>
              )}
            </>
          )}

          <div className="form-grid">
            <label>
              Merchant / Place
              <input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Zomato"
              />
            </label>

            <label>
              Notes
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>

          {error && <div className="error" role="alert">{error}</div>}

          <div className="modal-actions">
            <button
              className="secondary"
              type="button"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button className="primary" type="submit" disabled={busy}>
              {busy
                ? (editingTransaction ? "Updating…" : "Saving…")
                : (editingTransaction ? "Update Transaction" : "Save Transaction")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ============================================================
// TRANSACTIONS PAGE
// ============================================================

function Transactions({
  transactions,
  profiles,
  refresh,
  showToast,
  onEdit
}) {

  const [q, setQ] =
    useState("");

  const [filter, setFilter] =
    useState("all");


  const rows =
    transactions.filter((t) => {

      const text =
        `${t.merchant || ""} ${
          t.category || ""
        } ${
          t.notes || ""
        }`.toLowerCase();


      return (
        (!q ||
          text.includes(
            q.toLowerCase()
          )) &&
        (
          filter === "all" ||
          t.profile_id === filter ||
          t.type === filter
        )
      );

    });


  const del = async (id) => {

    if (
      !confirm(
        "Delete this transaction?"
      )
    ) {
      return;
    }


    const {
      error
    } =
      await supabase
        .from("transactions")
        .delete()
        .eq("id", id);


    if (error) {

      showToast(
        error.message
      );

    } else {

      refresh();

      showToast(
        "Transaction deleted"
      );

    }
  };


  return (
    <>
      <PageHead
        eyebrow="ACTIVITY"
        title="Transactions"
        desc="Search, filter and manage every entry."
      />


      <div className="panel">

        <div className="toolbar">

          <div className="search">

            <Search size={18} />

            <input
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              placeholder="Search merchant, category or notes…"
            />

          </div>


          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value
              )
            }
          >

            <option value="all">
              All
            </option>

            {profiles.map((p) => (

              <option
                value={p.id}
                key={p.id}
              >
                {p.name}
              </option>

            ))}

            <option value="expense">
              Expenses
            </option>

            <option value="income">
              Income
            </option>

            <option value="savings">
              Savings
            </option>

            <option value="shared_expense">
              Shared
            </option>

          </select>

        </div>


        {rows.length ? (

          <div className="tx-table">

            <div className="table-head">

              <span>
                Transaction
              </span>

              <span>
                Person
              </span>

              <span>
                Type
              </span>

              <span>
                Date
              </span>

              <span>
                Amount
              </span>

              <span />

            </div>


            {rows.map((t) => {

              const p =
                profiles.find(
                  (x) =>
                    x.id ===
                    t.profile_id
                );


              return (
                <div
                  className="table-row"
                  key={t.id}
                >

                  <span>

                    <b>
                      {t.merchant ||
                        t.category ||
                        "Transaction"}
                    </b>

                    <small>
                      {t.category}
                    </small>

                  </span>


                  <span>
                    {t.type ===
                    "shared_expense"
                      ? "🤝 Shared"
                      : p?.name}
                  </span>


                  <span className="pill">
                    {t.type}
                  </span>


                  <span>
                    {t.transaction_date}
                  </span>


                  <strong>
                    {money(t.amount)}
                  </strong>

                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {onEdit && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onEdit(t)}
                        aria-label="Edit transaction"
                        title="Edit transaction"
                      >
                        ✎
                      </button>
                    )}

                    <button
                      className="danger-icon"
                      onClick={() =>
                        del(t.id)
                      }
                    >
                    <Trash2 size={16} />
                  </button>
                  </div>

                </div>
              );
            })}

          </div>

        ) : (

          <Empty
            text="Nothing here yet 💜"
          />

        )}

      </div>
    </>
  );
}


// ============================================================
// ANALYTICS
// ============================================================

function Analytics({
  transactions,
  profiles
}) {

  const [scope, setScope] =
    useState("combined");


  const filtered =
    transactions.filter(
      (t) =>
        scope === "combined" ||
        t.profile_id === scope ||
        t.type === "shared_expense"
    );


  const expenses =
    filtered.filter(
      (t) =>
        t.type === "expense" ||
        t.type === "shared_expense"
    );


  const incomes =
    filtered.filter(
      (t) =>
        t.type === "income"
    );


  const cat = {};


  expenses.forEach((t) => {

    cat[t.category || "Other"] =
      (cat[t.category || "Other"] ||
        0) +
      Number(t.amount);

  });


  const pie =
    Object.entries(cat)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort(
        (a, b) =>
          b.value - a.value
      );


  const months = {};


  expenses.forEach((t) => {

    const m =
      t.transaction_date?.slice(
        0,
        7
      ) || "Unknown";

    months[m] =
      (months[m] || 0) +
      Number(t.amount);

  });


  const line =
    Object.entries(months)
      .sort()
      .slice(-6)
      .map(
        ([month, value]) => ({
          month,
          value
        })
      );


  return (
    <>
      <PageHead
        eyebrow="INSIGHTS"
        title="Analytics"
        desc="Understand where the money is going."
      />


      <div className="scope-tabs">

        <button
          className={
            scope === "combined"
              ? "active"
              : ""
          }
          onClick={() =>
            setScope("combined")
          }
        >
          Combined
        </button>


        {profiles.map((p) => (

          <button
            className={
              scope === p.id
                ? "active"
                : ""
            }
            key={p.id}
            onClick={() =>
              setScope(p.id)
            }
          >
            {p.name}
          </button>

        ))}

      </div>


      <div className="two-col">

        <div className="panel">

          <div className="panel-head">
            <h2>
              Spending by category
            </h2>
          </div>


          {pie.length ? (

            <ResponsiveContainer
              width="100%"
              height={330}
            >

              <PieChart>

                <Pie
                  data={pie.slice(0, 8)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={75}
                  outerRadius={115}
                >

                  {pie
                    .slice(0, 8)
                    .map(
                      (entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ANALYTICS_COLORS[
                              i %
                                ANALYTICS_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                </Pie>

                <Tooltip
                  formatter={(v) =>
                    money(v)
                  }
                />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          ) : (

            <Empty
              text="Add transactions to unlock analytics."
            />

          )}

        </div>


        <div className="panel">

          <div className="panel-head">
            <h2>
              Monthly spending
            </h2>
          </div>


          {line.length ? (

            <ResponsiveContainer
              width="100%"
              height={330}
            >

              <LineChart data={line}>

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="month"
                />

                <YAxis />

                <Tooltip
                  formatter={(v) =>
                    money(v)
                  }
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={3}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <Empty
              text="Not enough data yet."
            />

          )}

        </div>

      </div>


      <div className="panel">

        <div className="panel-head">

          <h2>
            Income vs expenses
          </h2>

        </div>


        <ResponsiveContainer
          width="100%"
          height={280}
        >

          <BarChart
            data={[
              {
                name: "Income",
                value:
                  incomes.reduce(
                    (s, t) =>
                      s +
                      Number(
                        t.amount
                      ),
                    0
                  )
              },

              {
                name: "Expenses",
                value:
                  expenses.reduce(
                    (s, t) =>
                      s +
                      Number(
                        t.amount
                      ),
                    0
                  )
              },

              {
                name: "Savings",
                value:
                  filtered
                    .filter(
                      (t) =>
                        t.type ===
                        "savings"
                    )
                    .reduce(
                      (s, t) =>
                        s +
                        Number(
                          t.amount
                        ),
                      0
                    )
              }
            ]}
          >

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="name"
            />

            <YAxis />

            <Tooltip
              formatter={(v) =>
                money(v)
              }
            />

            <Bar
              dataKey="value"
              radius={[
                8,
                8,
                0,
                0
              ]}
            >
              <Cell fill="#059669" />
              <Cell fill="#EF4444" />
              <Cell fill="#7C3AED" />
            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </>
  );
}


// ============================================================
// BUDGETS
// ============================================================

function Budgets({
  budgets,
  transactions,
  account,
  profiles,
  refresh,
  showToast
}) {

  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState("Food");

  const [pid, setPid] =
    useState("");

  const [month, setMonth] =
    useState(monthStart());


  const spent = (b) => {

    return transactions
      .filter(
        (t) =>
          t.transaction_date?.slice(
            0,
            7
          ) ===
            b.month?.slice(
              0,
              7
            ) &&
          ["expense", "shared_expense"].includes(
            t.type
          ) &&
          (!b.category ||
            t.category ===
              b.category) &&
          (!b.profile_id ||
            t.profile_id ===
              b.profile_id)
      )
      .reduce(
        (s, t) =>
          s + Number(t.amount),
        0
      );
  };


  const save = async (e) => {

    e.preventDefault();


    const {
      error
    } =
      await supabase
        .from("budgets")
        .insert({
          account_id:
            account.id,
          profile_id:
            pid || null,
          category:
            category === "All"
              ? null
              : category,
          amount:
            Number(amount),
          month
        });


    if (error) {

      showToast(
        error.message
      );

    } else {

      refresh();

      setAmount("");

      showToast(
        "Budget created"
      );

    }
  };


  return (
    <>
      <PageHead
        eyebrow="CONTROL"
        title="Budgets"
        desc="Set monthly limits and keep spending visible."
      />


      <div className="panel">

        <form
          className="inline-form"
          onSubmit={save}
        >

          <input
            type="number"
            min="0"
            placeholder="Budget amount"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
            required
          />


          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
          >

            {CATEGORIES.map(
              ([c]) => (
                <option
                  key={c}
                >
                  {c}
                </option>
              )
            )}

          </select>


          <select
            value={pid}
            onChange={(e) =>
              setPid(
                e.target.value
              )
            }
          >

            <option value="">
              Combined
            </option>

            {profiles.map(
              (p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name}
                </option>
              )
            )}

          </select>


          <input
            type="date"
            value={month}
            onChange={(e) =>
              setMonth(
                e.target.value
              )
            }
          />


          <button className="primary">
            <Plus size={17} />
            Add Budget
          </button>

        </form>

      </div>


      <div className="budget-grid">

        {budgets
          .slice(0, 12)
          .map((b) => {

            const s =
              spent(b);

            const pct =
              Math.min(
                100,
                (s /
                  Number(
                    b.amount
                  )) *
                  100
              );


            return (
              <div
                className="budget-card"
                key={b.id}
              >

                <div>

                  <b>
                    {b.category ||
                      "Combined"}
                  </b>

                  <span>
                    {profiles.find(
                      (p) =>
                        p.id ===
                        b.profile_id
                    )?.name ||
                      "Everyone"}
                  </span>

                </div>


                <strong>

                  {money(s)}

                  <small>
                    {" "}
                    /{" "}
                    {money(
                      b.amount
                    )}
                  </small>

                </strong>


                <div className="progress">

                  <i
                    style={{
                      width: `${pct}%`
                    }}
                  />

                </div>


                <small>
                  {pct.toFixed(0)}%
                  used ·{" "}
                  {money(
                    Math.max(
                      0,
                      Number(
                        b.amount
                      ) - s
                    )
                  )}{" "}
                  remaining
                </small>

              </div>
            );

          })}

      </div>


      {!budgets.length && (
        <Empty
          text="Create your first monthly budget."
        />
      )}

    </>
  );
}


// ============================================================
// SAVINGS
// ============================================================

function Savings({
  goals,
  transactions,
  account,
  profiles,
  refresh,
  showToast
}) {

  const [name, setName] =
    useState("");

  const [target, setTarget] =
    useState("");

  const [date, setDate] =
    useState("");

  const [pid, setPid] =
    useState("");


  const total =
    transactions
      .filter(
        (t) =>
          t.type ===
          "savings"
      )
      .reduce(
        (s, t) =>
          s + Number(t.amount),
        0
      );


  const save = async (e) => {

    e.preventDefault();


    const {
      error
    } =
      await supabase
        .from("savings_goals")
        .insert({
          account_id:
            account.id,
          profile_id:
            pid || null,
          name,
          target_amount:
            Number(target),
          target_date:
            date || null
        });


    if (error) {

      showToast(
        error.message
      );

    } else {

      refresh();

      setName("");
      setTarget("");
      setDate("");

      showToast(
        "Savings goal created"
      );

    }
  };


  return (
    <>
      <PageHead
        eyebrow="BUILD YOUR FUTURE"
        title="Savings Goals"
        desc="Savings are tracked separately from expenses."
      />


      <div className="stats-grid">

        <StatCard
          icon={<PiggyBank />}
          label="Total savings contributions"
          value={money(total)}
          sub="All time"
        />


        <StatCard
          icon={<Target />}
          label="Active goals"
          value={goals.length}
          sub="Keep going"
        />

      </div>


      <div className="panel">

        <form
          className="inline-form"
          onSubmit={save}
        >

          <input
            placeholder="Goal name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            required
          />


          <input
            type="number"
            min="1"
            placeholder="Target amount"
            value={target}
            onChange={(e) =>
              setTarget(
                e.target.value
              )
            }
            required
          />


          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
          />


          <select
            value={pid}
            onChange={(e) =>
              setPid(
                e.target.value
              )
            }
          >

            <option value="">
              Shared
            </option>

            {profiles.map(
              (p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name}
                </option>
              )
            )}

          </select>


          <button className="primary">
            <Plus size={17} />
            Create Goal
          </button>

        </form>

      </div>


      <div className="goal-grid">

        {goals.map((g) => {

          const pct =
            Math.min(
              100,
              (Number(
                g.current_amount
              ) /
                Number(
                  g.target_amount
                )) *
                100
            );


          return (
            <div
              className="goal-card"
              key={g.id}
            >

              <div className="goal-symbol">
                🎯
              </div>


              <div className="goal-title">

                <b>{g.name}</b>

                <span>
                  {profiles.find(
                    (p) =>
                      p.id ===
                      g.profile_id
                  )?.name ||
                    "Shared"}
                </span>

              </div>


              <strong>
                {money(
                  g.current_amount
                )}
              </strong>


              <small>
                of{" "}
                {money(
                  g.target_amount
                )}
              </small>


              <div className="progress">

                <i
                  style={{
                    width: `${pct}%`
                  }}
                />

              </div>


              <div className="goal-foot">

                <span>
                  {pct.toFixed(0)}%
                  complete
                </span>

                <span>
                  {money(
                    Math.max(
                      0,
                      Number(
                        g.target_amount
                      ) -
                        Number(
                          g.current_amount
                        )
                    )
                  )}{" "}
                  left
                </span>

              </div>

            </div>
          );

        })}

      </div>


      {!goals.length && (
        <Empty
          text="Your savings journey starts here 💜"
        />
      )}

    </>
  );
}


// ============================================================
// RECURRING
// ============================================================

function Recurring({
  items,
  account,
  profiles,
  refresh,
  showToast
}) {

  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [date, setDate] =
    useState("");

  const [pid, setPid] =
    useState(
      profiles[0]?.id || ""
    );

  const [editingItem, setEditingItem] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState("");

  const resetForm = () => {
    setName("");
    setAmount("");
    setDate("");
    setPid(profiles[0]?.id || "");
    setEditingItem(null);
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setName(item.name || "");
    setAmount(String(item.amount ?? ""));
    setDate(item.next_due_date || "");
    setPid(item.profile_id || profiles[0]?.id || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e) => {
    e.preventDefault();

    const payload = {
      account_id: account.id,
      profile_id: pid,
      name: name.trim(),
      amount: Number(amount),
      category: "Other",
      frequency: "monthly",
      next_due_date: date
    };

    if (!payload.name) {
      showToast("Enter a recurring payment name.");
      return;
    }

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      showToast("Enter a valid amount.");
      return;
    }

    if (!payload.next_due_date) {
      showToast("Select the next due date.");
      return;
    }

    const query = editingItem
      ? supabase
          .from("recurring_transactions")
          .update(payload)
          .eq("id", editingItem.id)
          .eq("account_id", account.id)
      : supabase
          .from("recurring_transactions")
          .insert(payload);

    const { error } = await query;

    if (error) {
      console.error("Recurring save error:", error);
      showToast(error.message);
      return;
    }

    await refresh();
    resetForm();

    showToast(
      editingItem
        ? "Recurring payment updated"
        : "Recurring payment added"
    );
  };

  const deleteRecurring = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.name}" (${money(item.amount)})?`
    );

    if (!confirmed) return;

    setDeletingId(item.id);

    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", item.id)
        .eq("account_id", account.id);

      if (error) throw error;

      if (editingItem?.id === item.id) {
        resetForm();
      }

      await refresh();
      showToast("Recurring payment deleted");
    } catch (error) {
      console.error("Recurring delete error:", error);
      showToast(error?.message || "Could not delete recurring payment.");
    } finally {
      setDeletingId("");
    }
  };


  return (
    <>
      <PageHead
        eyebrow="AUTOMATE"
        title="Recurring"
        desc="Keep rent, subscriptions and regular bills on your radar."
      />


      <div className="panel">

        <div className="panel-head">
          <div>
            <h2>
              {editingItem
                ? "Edit recurring payment"
                : "Add recurring payment"}
            </h2>
            <span>
              {editingItem
                ? "Update the details and save your changes."
                : "Add rent, subscriptions and other regular payments."}
            </span>
          </div>

          {editingItem && (
            <button
              type="button"
              className="ghost"
              onClick={resetForm}
            >
              <X size={16} />
              Cancel
            </button>
          )}
        </div>

        <form
          className="inline-form"
          onSubmit={save}
        >

          <input
            placeholder="Name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            required
          />


          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
            required
          />


          <select
            value={pid}
            onChange={(e) =>
              setPid(
                e.target.value
              )
            }
          >

            {profiles.map(
              (p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name}
                </option>
              )
            )}

          </select>


          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
            required
          />


          <button className="primary">
            {editingItem ? (
              <>
                <Check size={17} />
                Save Changes
              </>
            ) : (
              <>
                <Plus size={17} />
                Add
              </>
            )}
          </button>

        </form>

      </div>


      <div className="list-cards">

        {items.map((x) => (

          <div
            className="recurring-row"
            key={x.id}
            style={{
              position: "relative",
              paddingRight: 170,
              minHeight: 64
            }}
          >

            <div className="tx-icon">
              <Repeat2 />
            </div>


            <div>

              <b>{x.name}</b>

              <span>
                {
                  profiles.find(
                    (p) =>
                      p.id ===
                      x.profile_id
                  )?.name
                }{" "}
                ·{" "}
                {x.frequency}
              </span>

            </div>


            <strong>
              {money(x.amount)}
            </strong>


            <small>
              Due{" "}
              {x.next_due_date}
            </small>

            <div
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                zIndex: 5
              }}
            >
              <button
                type="button"
                title="Edit recurring payment"
                aria-label={`Edit ${x.name}`}
                onClick={() => startEdit(x)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 36,
                  padding: "0 10px",
                  border: "1px solid #ddd6fe",
                  borderRadius: 9,
                  background: "#ffffff",
                  color: "#6d28d9",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13
                }}
              >
                <Edit3 size={15} />
                Edit
              </button>

              <button
                type="button"
                title="Delete recurring payment"
                aria-label={`Delete ${x.name}`}
                disabled={deletingId === x.id}
                onClick={() => deleteRecurring(x)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 36,
                  padding: "0 10px",
                  border: "1px solid #fecaca",
                  borderRadius: 9,
                  background: "#ffffff",
                  color: "#dc2626",
                  cursor: deletingId === x.id ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  opacity: deletingId === x.id ? 0.6 : 1
                }}
              >
                <Trash2 size={15} />
                {deletingId === x.id ? "Deleting..." : "Delete"}
              </button>
            </div>

          </div>

        ))}

      </div>


      {!items.length && (
        <Empty
          text="No recurring payments yet."
        />
      )}

    </>
  );
}


// ============================================================
// RECEIPTS
// ============================================================

function Receipts({
  transactions
}) {

  const rows =
    transactions.filter(
      (t) => t.receipt_url
    );


  return (
    <>
      <PageHead
        eyebrow="DOCUMENTS"
        title="Receipts"
        desc="Receipts attached to your transactions."
      />


      <div className="receipt-grid">

        {rows.map((t) => (

          <div
            className="receipt-card"
            key={t.id}
          >

            <div className="receipt-placeholder">
              🧾
            </div>

            <b>
              {t.merchant ||
                t.category}
            </b>

            <span>
              {money(t.amount)} ·{" "}
              {t.transaction_date}
            </span>


            {t.receipt_url && (

              <a
                href={t.receipt_url}
                target="_blank"
                rel="noreferrer"
              >
                View receipt
              </a>

            )}

          </div>

        ))}

      </div>


      {!rows.length && (
        <Empty
          text="No receipts attached yet."
        />
      )}

    </>
  );
}


// ============================================================
// REPORTS
// ============================================================

function Reports({
  transactions,
  profiles
}) {
  const today = localDateKey(new Date());

  const firstOfMonth = (() => {
    const d = new Date();
    d.setDate(1);
    return localDateKey(d);
  })();

  const [fromDate, setFromDate] =
    useState(firstOfMonth);

  const [toDate, setToDate] =
    useState(today);

  const rows = transactions
    .filter((t) => {
      const date = localDateKey(t.transaction_date);
      return (
        date &&
        date >= fromDate &&
        date <= toDate
      );
    })
    .sort(
      (a, b) =>
        localDateKey(a.transaction_date).localeCompare(
          localDateKey(b.transaction_date)
        )
    );

  const income =
    rows
      .filter((t) => t.type === "income")
      .reduce(
        (s, t) => s + Number(t.amount || 0),
        0
      );

  const exp =
    rows
      .filter((t) => isExpenseType(t.type))
      .reduce(
        (s, t) => s + Number(t.amount || 0),
        0
      );

  const sav =
    rows
      .filter((t) => t.type === "savings")
      .reduce(
        (s, t) => s + Number(t.amount || 0),
        0
      );

  const personName = (t) => {
    if (t.type === "shared_expense" && t.shared_paid_by) {
      return (
        profiles.find(
          (p) => p.id === t.shared_paid_by
        )?.name || "Shared"
      );
    }

    return (
      profiles.find(
        (p) => p.id === t.profile_id
      )?.name || "Shared"
    );
  };

  const csvEscape = (value) => {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csv = () => {
    if (!rows.length) {
      alert("There are no transactions in the selected date range.");
      return;
    }

    const header = [
      "Date",
      "Person",
      "Type",
      "Category",
      "Amount",
      "Payment Method",
      "Merchant",
      "Notes"
    ];

    const body = rows.map((t) =>
      [
        localDateKey(t.transaction_date),
        personName(t),
        t.type,
        t.category || "",
        Number(t.amount || 0),
        t.payment_method || "",
        t.merchant || "",
        t.notes || ""
      ]
        .map(csvEscape)
        .join(",")
    );

    const csvText = [header.map(csvEscape).join(","), ...body].join("\n");

    const a = document.createElement("a");

    a.href = URL.createObjectURL(
      new Blob(
        [csvText],
        { type: "text/csv;charset=utf-8" }
      )
    );

    a.download =
      `us-report-${fromDate}-to-${toDate}.csv`;

    a.click();

    URL.revokeObjectURL(a.href);
  };

  const setThisMonth = () => {
    const d = new Date();
    const start = new Date(
      d.getFullYear(),
      d.getMonth(),
      1
    );

    setFromDate(localDateKey(start));
    setToDate(localDateKey(d));
  };

  const setLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);

    setFromDate(localDateKey(start));
    setToDate(localDateKey(end));
  };

  const invalidRange =
    fromDate &&
    toDate &&
    fromDate > toDate;

  return (
    <>
      <PageHead
        eyebrow="EXPORT"
        title="Reports"
        desc="Generate and download a financial report for any date range."
      />

      <div className="report-controls">
        <label>
          From date

          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) =>
              setFromDate(e.target.value)
            }
          />
        </label>

        <label>
          To date

          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) =>
              setToDate(e.target.value)
            }
          />
        </label>

        <button
          type="button"
          className="secondary"
          onClick={setThisMonth}
        >
          This month
        </button>

        <button
          type="button"
          className="secondary"
          onClick={setLast30Days}
        >
          Last 30 days
        </button>

        <button
          type="button"
          className="primary"
          onClick={csv}
          disabled={invalidRange || !rows.length}
        >
          <FileText size={17} />
          Download CSV
        </button>
      </div>

      {invalidRange && (
        <div className="panel" style={{ marginTop: 16 }}>
          <p className="muted">
            Please select a From date that is on or before the To date.
          </p>
        </div>
      )}

      <div className="stats-grid">

        <StatCard
          icon={<ArrowUpRight />}
          label="Income"
          value={money(income)}
          sub={`${fromDate} → ${toDate}`}
        />

        <StatCard
          icon={<ArrowDownRight />}
          label="Expenses"
          value={money(exp)}
          sub={`${rows.filter((t) => isExpenseType(t.type)).length} expenses`}
        />

        <StatCard
          icon={<PiggyBank />}
          label="Savings"
          value={money(sav)}
          sub={`${rows.filter((t) => t.type === "savings").length} savings entries`}
        />

        <StatCard
          icon={<Wallet />}
          label="Balance"
          value={money(income - exp - sav)}
          sub="Income − expenses − savings"
        />

      </div>

      <div className="panel">

        <div className="panel-head">

          <div>
            <h2>
              Report summary
            </h2>

            <span>
              {rows.length} transactions from {fromDate} to {toDate}.
            </span>
          </div>

          <button
            type="button"
            className="secondary"
            onClick={csv}
            disabled={invalidRange || !rows.length}
          >
            <FileText size={16} />
            Download CSV
          </button>

        </div>

        {!rows.length ? (
          <Empty
            text="No transactions found for the selected date range."
          />
        ) : (
          <div className="transaction-list">
            {rows.slice(0, 20).map((t) => (
              <div
                className="transaction-row"
                key={t.id}
              >
                <div className="transaction-main">
                  <div className="transaction-icon">
                    {t.type === "income"
                      ? "↗"
                      : t.type === "savings"
                      ? "🏦"
                      : "↘"}
                  </div>

                  <div>
                    <strong>
                      {t.merchant ||
                        t.category ||
                        "Transaction"}
                    </strong>

                    <span>
                      {personName(t)} · {localDateKey(t.transaction_date)}
                    </span>
                  </div>
                </div>

                <strong>
                  {money(t.amount)}
                </strong>
              </div>
            ))}

            {rows.length > 20 && (
              <p className="muted">
                Showing the first 20 transactions here. The downloaded CSV contains all {rows.length} transactions.
              </p>
            )}
          </div>
        )}

      </div>
    </>
  );
}


// ============================================================
// SETTINGS
// ============================================================

function SettingsPage({
  settings,
  account,
  profiles,
  session,
  avatarUrl,
  avatarBusy,
  onAvatarChange,
  onAvatarRemove,
  onLogout,
  dark,
  setDark,
  refresh,
  showToast
}) {

  const [one, setOne] =
    useState(
      settings?.person_one_name ||
        "Santhosh"
    );

  const [two, setTwo] =
    useState(
      settings?.person_two_name ||
        "Sindhuja"
    );

  useEffect(() => {
    setOne(settings?.person_one_name || "Santhosh");
    setTwo(settings?.person_two_name || "Sindhuja");
  }, [settings?.person_one_name, settings?.person_two_name]);

  const save = async () => {

    const {
      error
    } =
      await supabase
        .from("settings")
        .update({
          person_one_name:
            one,

          person_two_name:
            two,

          dark_mode:
            dark
        })
        .eq(
          "account_id",
          account.id
        );


    if (error) {

      showToast(
        error.message
      );

      return;
    }


    const profileUpdates = [];

    if (profiles[0]) {
      profileUpdates.push(
        supabase
          .from("profiles")
          .update({ name: one.trim() || "Santhosh" })
          .eq("id", profiles[0].id)
      );
    }

    if (profiles[1]) {
      profileUpdates.push(
        supabase
          .from("profiles")
          .update({ name: two.trim() || "Sindhuja" })
          .eq("id", profiles[1].id)
      );
    }

    const profileResults = await Promise.all(profileUpdates);
    const profileError = profileResults.find((result) => result.error)?.error;

    if (profileError) {
      showToast(profileError.message);
      return;
    }

    refresh();

    showToast(
      "Settings saved"
    );
  };


  return (
    <>
      <PageHead
        eyebrow="PREFERENCES"
        title="Settings"
        desc="Keep your shared account configured the way you like it."
      />


      <div className="settings-grid">

        <div className="panel">

          <h2>Account</h2>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: "50%",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                background: "#efe6ff",
                color: "#6d28d9",
                border: "3px solid rgba(124,58,237,.12)",
                flexShrink: 0
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <UserCircle size={48} />
              )}
            </div>

            <div>
              <b style={{ display: "block", marginBottom: 4 }}>Profile picture</b>
              <span className="muted" style={{ display: "block", marginBottom: 10 }}>
                {session?.user?.email || "Shared account"}
              </span>
              <label className="primary" style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: avatarBusy ? "wait" : "pointer", opacity: avatarBusy ? 0.7 : 1 }}>
                <Camera size={16} />
                {avatarBusy ? "Updating…" : "Change picture"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    onAvatarChange?.(file);
                  }}
                  disabled={avatarBusy}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

          {avatarUrl && (
            <button
              type="button"
              className="secondary"
              disabled={avatarBusy}
              onClick={onAvatarRemove}
            >
              Remove picture
            </button>
          )}

        </div>

        <div className="panel">

          <h2>
            Profiles
          </h2>


          <label>

            Person 1

            <input
              value={one}
              onChange={(e) =>
                setOne(
                  e.target.value
                )
              }
            />

          </label>


          <label>

            Person 2

            <input
              value={two}
              onChange={(e) =>
                setTwo(
                  e.target.value
                )
              }
            />

          </label>


          <button
            className="primary"
            onClick={save}
          >
            Save profile names
          </button>

        </div>


        <div className="panel">

          <h2>
            Appearance
          </h2>


          <div className="setting-row">

            <div>

              <b>
                Dark mode
              </b>

              <span>
                Use a darker interface
              </span>

            </div>


            <button
              className={`switch ${
                dark
                  ? "on"
                  : ""
              }`}
              onClick={() =>
                setDark(!dark)
              }
            >
              <i />
            </button>

          </div>


          <div className="setting-row">

            <div>

              <b>
                Currency
              </b>

              <span>
                Indian Rupee (₹ INR)
              </span>

            </div>


            <strong>
              ₹ INR
            </strong>

          </div>

        </div>


        <div className="panel">

          <h2>
            Security
          </h2>


          <p className="muted">
            This app uses Supabase Auth.
            Never store UPI PINs, CVVs,
            bank passwords or OTPs here.
          </p>


          <button
            className="secondary"
            onClick={onLogout}
          >

            <LogOut size={17} />

            Logout

          </button>

        </div>

      </div>

    </>
  );
}