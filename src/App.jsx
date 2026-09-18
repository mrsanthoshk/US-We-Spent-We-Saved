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
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2
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
    Shopping: ShoppingCart,
    Entertainment: Gamepad2,
    "Mobile & Internet": Smartphone,
    Fitness: Dumbbell,
    Education: GraduationCap,
    Health: HeartPulse,
    "EMI / Loan": CreditCard,
    Gifts: Gift,
    Travel: Plane,
    Other: MoreHorizontal
  }[cat] || MoreHorizontal);

const transactionLabel = (transaction) => {
  const type = transaction?.type;

  if (type === "income") {
    return (
      transaction.merchant?.trim() ||
      (INCOME_SOURCES.includes(transaction.category)
        ? transaction.category
        : "Income")
    );
  }

  if (type === "savings") {
    return transaction.merchant?.trim() || "Savings";
  }

  if (type === "shared_expense") {
    return (
      transaction.merchant?.trim() ||
      transaction.category ||
      "Shared Expense"
    );
  }

  return (
    transaction.merchant?.trim() ||
    transaction.category ||
    "Expense"
  );
};

const transactionIcon = (transaction) => {
  if (transaction?.type === "income") {
    return ArrowUpRight;
  }

  if (transaction?.type === "savings") {
    return PiggyBank;
  }

  if (transaction?.type === "shared_expense") {
    return UsersRound;
  }

  return iconFor(transaction?.category);
};


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

  useEffect(() => {
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const cursor = document.createElement("div");
    cursor.className = "us-purple-cursor";
    document.body.appendChild(cursor);

    let raf = 0;
    let x = -100, y = -100, targetX = -100, targetY = -100;

    const animate = () => {
      x += (targetX - x) * 0.22;
      y += (targetY - y) * 0.22;
      cursor.style.transform =
        `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(animate);
    };

    const move = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      cursor.classList.add("is-visible");
    };

    const hover = (e) => {
      const interactive = e.target?.closest?.(
        "button, a, select, input, textarea, [role='button']"
      );
      cursor.classList.toggle("is-hover", Boolean(interactive));
    };

    const leave = () => cursor.classList.remove("is-visible");

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseover", hover);
    document.addEventListener("mouseout", hover);
    document.addEventListener("mouseleave", leave);
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", hover);
      document.removeEventListener("mouseout", hover);
      document.removeEventListener("mouseleave", leave);
      cursor.remove();
    };
  }, []);

  // Subtle custom cursor on desktop. It disappears on touch devices.
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = document.createElement("div");
    dot.className = "us-cursor-dot";
    document.body.appendChild(dot);

    let visible = false;

    const move = (event) => {
      dot.style.left = `${event.clientX}px`;
      dot.style.top = `${event.clientY}px`;

      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
      }
    };

    const overInteractive = (event) => {
      const target = event.target?.closest?.(
        "button, a, select, input, textarea, [role='button']"
      );

      dot.classList.toggle("is-active", Boolean(target));
    };

    const leave = () => {
      dot.style.opacity = "0";
      dot.classList.remove("is-active");
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseover", overInteractive);
    document.addEventListener("mouseout", overInteractive);
    document.addEventListener("mouseleave", leave);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", overInteractive);
      document.removeEventListener("mouseout", overInteractive);
      document.removeEventListener("mouseleave", leave);
      dot.remove();
    };
  }, []);
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Profile picture is stored in Supabase Storage and the public URL is
  // stored on the shared account row. This keeps the picture available
  // after refresh, logout/login, and on other devices.
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [reminderBusy, setReminderBusy] = useState(false);
  const [notifiedReminderIds, setNotifiedReminderIds] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("us_notified_reminders") || "[]"
      );
    } catch {
      return [];
    }
  });


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
        setReminders([]);
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
      st,
      rm
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
        .single(),

      supabase
        .from("reminders")
        .select("*")
        .eq("account_id", aid)
        .order("reminder_at", {
          ascending: true
        })
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

    if (rm.data) {
      setReminders(rm.data);
    } else if (rm.error) {
      console.error("Reminders load failed:", rm.error);
      setReminders([]);
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
  // NOTIFICATIONS + REMINDERS
  // ==========================================================

  const notificationItems = [
    ...reminders
      .filter((r) => !r.completed)
      .map((r) => ({
        kind: "reminder",
        id: r.id,
        title: r.title,
        text: r.note || "Reminder",
        date: r.reminder_at,
        reminder: r
      })),
    ...recurring
      .filter((r) => r.next_due_date)
      .filter((r) => {
        const due = localDateKey(r.next_due_date);
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 7);
        return due >= localDateKey(now) && due <= localDateKey(future);
      })
      .map((r) => ({
        kind: "recurring",
        id: `recurring-${r.id}`,
        title: `${r.name} due soon`,
        text: `${money(r.amount)} · ${r.profile_id ? profiles.find((p) => p.id === r.profile_id)?.name || "" : "Shared"}`,
        date: r.next_due_date
      })),
    ...transactions.slice(0, 5).map((t) => ({
      kind: "activity",
      id: `transaction-${t.id}`,
      title: transactionLabel(t),
      text: `${t.type === "income" ? "Income" : t.type === "savings" ? "Savings" : "Expense"} · ${money(t.amount)}`,
      date: t.transaction_date
    }))
  ];

  const pendingReminders = reminders.filter(
    (r) => !r.completed && new Date(r.reminder_at).getTime() <= Date.now()
  );

  const notificationCount =
    pendingReminders.length +
    recurring.filter((r) => {
      if (!r.next_due_date) return false;
      const today = localDateKey(new Date());
      const due = localDateKey(r.next_due_date);
      const limit = new Date();
      limit.setDate(limit.getDate() + 7);
      return due >= today && due <= localDateKey(limit);
    }).length;

  const resetReminderForm = () => {
    setReminderTitle("");
    setReminderNote("");
    setReminderAt("");
    setShowReminderForm(false);
  };

  const addReminder = async () => {
    if (!account?.id || !reminderTitle.trim() || !reminderAt) {
      showToast("Enter a reminder title and date/time.");
      return;
    }

    setReminderBusy(true);

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        account_id: account.id,
        title: reminderTitle.trim(),
        note: reminderNote.trim() || null,
        reminder_at: new Date(reminderAt).toISOString(),
        completed: false
      })
      .select("*")
      .single();

    setReminderBusy(false);

    if (error) {
      console.error("Reminder create failed:", error);
      showToast(error.message);
      return;
    }

    setReminders((items) =>
      [...items, data].sort(
        (a, b) =>
          new Date(a.reminder_at) -
          new Date(b.reminder_at)
      )
    );

    resetReminderForm();
    showToast("Reminder added.");
  };

  const completeReminder = async (id) => {
    const { error } = await supabase
      .from("reminders")
      .update({ completed: true })
      .eq("id", id)
      .eq("account_id", account.id);

    if (error) {
      showToast(error.message);
      return;
    }

    setReminders((items) =>
      items.map((r) =>
        r.id === id
          ? { ...r, completed: true }
          : r
      )
    );

    showToast("Reminder completed.");
  };

  const deleteReminder = async (id) => {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("account_id", account.id);

    if (error) {
      showToast(error.message);
      return;
    }

    setReminders((items) =>
      items.filter((r) => r.id !== id)
    );

    showToast("Reminder deleted.");
  };

  const enableBrowserNotifications = async () => {
    if (!("Notification" in window)) {
      showToast("Browser notifications are not supported here.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      showToast("Browser notifications enabled.");
    } else {
      showToast("Browser notifications are blocked.");
    }
  };

  // Check due reminders while the website is open.
  useEffect(() => {
    if (!account?.id || !reminders.length) return;

    const checkReminders = async () => {
      const now = Date.now();
      const alreadyNotified = new Set(notifiedReminderIds);
      let changed = false;

      for (const reminder of reminders) {
        if (
          reminder.completed ||
          new Date(reminder.reminder_at).getTime() > now ||
          alreadyNotified.has(reminder.id)
        ) {
          continue;
        }

        showToast(`Reminder: ${reminder.title}`);

        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(
            `US · ${reminder.title}`,
            {
              body:
                reminder.note ||
                "Your finance reminder is due.",
              icon: avatarUrl || undefined
            }
          );
        }

        alreadyNotified.add(reminder.id);
        changed = true;
      }

      if (changed) {
        const ids = [...alreadyNotified];
        setNotifiedReminderIds(ids);

        try {
          localStorage.setItem(
            "us_notified_reminders",
            JSON.stringify(ids.slice(-100))
          );
        } catch {}
      }
    };

    checkReminders();
    const timer = setInterval(checkReminders, 30000);

    return () => clearInterval(timer);
  }, [account?.id, reminders, avatarUrl]);

  const reminderInputValue = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 60);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

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
    setReminders([]);
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
    <div
      className={
        sidebarCollapsed
          ? "app-shell sidebar-is-collapsed"
          : "app-shell"
      }
      style={{
        "--sidebar-width": sidebarCollapsed
          ? "76px"
          : "245px"
      }}
    >

      <style>{`
        /* =========================================================
           MONEY COLORS
           ========================================================= */

        .money-positive {
          color: #15803d !important;
          font-weight: 700 !important;
          transition: color 160ms ease, transform 160ms ease;
        }

        .money-negative {
          color: #dc2626 !important;
          font-weight: 700 !important;
          transition: color 160ms ease, transform 160ms ease;
        }

        /* Chart hover polish */
        .recharts-bar-rectangle,
        .recharts-line-dot {
          transition: opacity 180ms ease, filter 180ms ease;
        }

        .recharts-bar-rectangle:hover {
          filter: brightness(1.05) saturate(1.12);
        }

        .report-transaction-row:hover .money-positive,
        .report-transaction-row:hover .money-negative {
          transform: translateX(-2px);
        }

        /* =========================================================
           REPORT TRANSACTION ROW FIX
           ========================================================= */

        .report-transaction-row {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 20px !important;
          width: 100% !important;
          min-height: 68px !important;
          padding: 12px 4px !important;
          box-sizing: border-box !important;
        }

        .report-transaction-main {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          min-width: 0 !important;
          flex: 1 1 auto !important;
        }

        .report-transaction-icon {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          border-radius: 11px !important;
          display: grid !important;
          place-items: center !important;
          background: #f0e7ff !important;
          color: #6d28d9 !important;
          font-size: 17px !important;
          flex-shrink: 0 !important;
        }

        .report-transaction-info {
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
          min-width: 0 !important;
        }

        .report-transaction-info strong {
          display: block !important;
          font-size: 14px !important;
          line-height: 1.3 !important;
          font-weight: 700 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .report-transaction-info span {
          display: block !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
          color: #7b7285 !important;
          white-space: nowrap !important;
        }

        .report-transaction-amount {
          display: block !important;
          flex: 0 0 auto !important;
          min-width: 105px !important;
          text-align: right !important;
          font-size: 14px !important;
          line-height: 1.3 !important;
          font-weight: 700 !important;
          white-space: nowrap !important;
        }

        @media (max-width: 600px) {
          .report-transaction-row {
            gap: 10px !important;
          }

          .report-transaction-icon {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
          }

          .report-transaction-amount {
            min-width: 82px !important;
            font-size: 13px !important;
          }
        }


        /* =========================================================
           INTERACTION + CURSOR POLISH
           ========================================================= */
        @media (pointer: fine) {
          * {
            cursor: none !important;
          }
        }

        .us-purple-cursor {
          position: fixed;
          left: 0;
          top: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #7c3aed;
          border: 2px solid #ffffff;
          box-shadow:
            0 0 0 5px rgba(124, 58, 237, .12),
            0 4px 14px rgba(76, 29, 149, .22);
          pointer-events: none;
          z-index: 2147483647;
          opacity: 0;
          transform: translate3d(-100px, -100px, 0) translate(-50%, -50%);
          transition:
            width 140ms ease,
            height 140ms ease,
            opacity 140ms ease,
            background-color 140ms ease,
            box-shadow 140ms ease;
          will-change: transform;
        }

        .us-purple-cursor.is-visible {
          opacity: 1;
        }

        .us-purple-cursor.is-hover {
          width: 18px;
          height: 18px;
          background: #8b5cf6;
          box-shadow:
            0 0 0 6px rgba(124, 58, 237, .10),
            0 5px 18px rgba(76, 29, 149, .24);
        }

        @media (pointer: coarse), (prefers-reduced-motion: reduce) {
          .us-purple-cursor {
            display: none !important;
          }

          * {
            cursor: auto !important;
          }
        }

          button,
          a,
          select,
          input[type="checkbox"],
          input[type="radio"],
          summary,
          [role="button"],
          input,
          textarea {
            cursor: url("/Busy-Cloud.ani"), auto;
          }
        }

        button,
        a,
        select,
        input[type="checkbox"],
        input[type="radio"],
        summary,
        [role="button"] {
          cursor: pointer;
        }

        input,
        textarea {
          cursor: text;
        }

        button,
        .card,
        .stat-card,
        .person-card,
        .recent-item,
        .recurring-row,
        .bank-card,
        .goal-card,
        .budget-card,
        .setting-card,
        .icon-btn,
        .primary,
        .secondary,
        select,
        input,
        textarea {
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease,
            background-color 180ms ease,
            color 180ms ease,
            opacity 180ms ease;
        }

        button:active,
        .primary:active,
        .secondary:active,
        .icon-btn:active {
          transform: scale(0.97);
        }

        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 3px solid rgba(124, 58, 237, .18);
          outline-offset: 2px;
        }

        .primary:hover,
        button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 9px 22px rgba(109, 40, 217, .22);
        }

        .secondary:hover {
          transform: translateY(-1px);
        }

        .icon-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 18px rgba(20, 10, 40, .10);
          border-color: rgba(124, 58, 237, .25) !important;
        }

        .card:hover,
        .stat-card:hover,
        .person-card:hover,
        .recent-item:hover,
        .recurring-row:hover,
        .bank-card:hover,
        .goal-card:hover,
        .budget-card:hover,
        .setting-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(30, 20, 50, .07);
        }

        .sidebar button,
        .sidebar a {
          transition:
            transform 160ms ease,
            background-color 160ms ease,
            color 160ms ease;
        }

        .sidebar button:hover,
        .sidebar a:hover {
          transform: translateX(3px);
        }

        .topbar {
          position: relative;
          z-index: 20;
        }

        .main > * {
          animation: pageContentIn 360ms cubic-bezier(.22, 1, .36, 1);
        }

        @keyframes pageContentIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes softPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
          }
          50% {
            box-shadow: 0 0 0 5px rgba(124, 58, 237, .08);
          }
        }

        .top-actions .icon-btn[aria-label="Notifications"] {
          position: relative;
        }

        .top-actions .icon-btn[aria-label="Notifications"]:has(
          span[style*="background: #7c3aed"]
        ) {
          animation: softPulse 2.4s ease-in-out infinite;
        }

        input:hover,
        select:hover,
        textarea:hover {
          border-color: rgba(124, 58, 237, .28) !important;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, .08);
        }

        .account-menu-wrap > button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(20, 10, 40, .10) !important;
        }

        .account-menu-wrap .secondary:hover {
          background: #f6f1ff;
          border-color: rgba(124, 58, 237, .18);
        }

        /* Custom cursor */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }

          .us-cursor-dot {
            display: none;
          }
        }

        .bank-waiting-row {
          display: grid !important;
          grid-template-columns: 42px minmax(180px, 240px) 120px minmax(260px, 1fr) !important;
          align-items: center !important;
          column-gap: 14px !important;
          min-height: 82px !important;
          padding: 14px 16px !important;
          box-sizing: border-box !important;
        }

        .bank-waiting-row .bank-waiting-title {
          display: block !important;
          min-width: 0 !important;
          font-size: 15px !important;
          line-height: 1.25 !important;
          font-weight: 700 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .bank-waiting-row .bank-waiting-meta {
          display: block !important;
          margin-top: 4px !important;
          font-size: 12px !important;
          line-height: 1.3 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .bank-waiting-row .bank-waiting-amount {
          display: block !important;
          font-size: 15px !important;
          line-height: 1.25 !important;
          font-weight: 700 !important;
          white-space: nowrap !important;
          text-align: right !important;
        }

        .bank-waiting-row select {
          width: 100% !important;
          min-width: 0 !important;
          height: 44px !important;
          padding: 0 12px !important;
          font-size: 14px !important;
          line-height: 1.2 !important;
        }

        @media (max-width: 900px) {
          .bank-waiting-row {
            grid-template-columns: 42px minmax(150px, 1fr) 110px !important;
          }

          .bank-waiting-row select {
            grid-column: 2 / -1 !important;
          }
        }

        @media (max-width: 600px) {
          .bank-waiting-row {
            grid-template-columns: 40px minmax(0, 1fr) !important;
            row-gap: 8px !important;
          }

          .bank-waiting-row .bank-waiting-amount {
            grid-column: 2 !important;
            text-align: left !important;
          }

          .bank-waiting-row select {
            grid-column: 2 !important;
          }
        }

        .app-shell {
          --sidebar-width: 245px;
        }

        /* =========================================================
           MOBILE UI — PHONE OPTIMIZATION
           ========================================================= */

        @media (max-width: 760px) {
          html,
          body,
          #root {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .app-shell {
            min-height: 100dvh !important;
            width: 100% !important;
            overflow-x: hidden !important;
          }

          .app-shell .main {
            min-height: 100dvh !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 0 104px !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          .topbar {
            position: sticky !important;
            top: 0 !important;
            height: 64px !important;
            min-height: 64px !important;
            padding: 10px 16px !important;
            box-sizing: border-box !important;
            background: rgba(255, 255, 255, .96) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border-bottom: 1px solid rgba(124, 58, 237, .10) !important;
            z-index: 1000 !important;
          }

          .mobile-brand {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            min-width: 0 !important;
            gap: 1px !important;
          }

          .mobile-brand b {
            font-size: 20px !important;
            line-height: 1.05 !important;
            font-weight: 800 !important;
          }

          .mobile-brand span {
            font-size: 9px !important;
            line-height: 1.2 !important;
            color: #7b7285 !important;
            white-space: nowrap !important;
          }

          .top-actions {
            display: flex !important;
            align-items: center !important;
            gap: 7px !important;
            margin-left: auto !important;
          }

          .top-actions .icon-btn {
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
            border-radius: 11px !important;
          }

          .top-actions .account-menu-wrap > button {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            padding: 0 !important;
            border-radius: 50% !important;
            border: 2px solid #eee7f7 !important;
            overflow: hidden !important;
          }

          .top-actions .account-menu-wrap > button img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }

          .content {
            width: 100% !important;
            max-width: 100% !important;
            padding: 20px 14px 0 !important;
            box-sizing: border-box !important;
          }

          .page-head {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
            margin-bottom: 20px !important;
          }

          .page-head h1 {
            font-size: 28px !important;
            line-height: 1.12 !important;
            letter-spacing: -.5px !important;
            margin: 4px 0 8px !important;
          }

          .page-head p {
            font-size: 14px !important;
            line-height: 1.55 !important;
            margin: 0 !important;
          }

          .page-head > div:last-child,
          .page-head > .primary,
          .page-head > button {
            width: 100% !important;
          }

          .page-head .primary,
          .page-head button.primary {
            min-height: 52px !important;
            width: 100% !important;
            justify-content: center !important;
            font-size: 15px !important;
            border-radius: 13px !important;
          }

          .stats-grid,
          .people-grid,
          .budget-grid,
          .goal-grid,
          .receipt-grid,
          .settings-grid,
          .two-col {
            grid-template-columns: 1fr !important;
            width: 100% !important;
            gap: 12px !important;
          }

          .stat-card,
          .person-card,
          .panel,
          .card {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            border-radius: 16px !important;
          }

          .stat-card {
            min-height: 112px !important;
            padding: 16px !important;
          }

          .stat-card .stat-icon {
            width: 42px !important;
            height: 42px !important;
            min-width: 42px !important;
          }

          .stat-card h3,
          .stat-card b {
            font-size: 20px !important;
          }

          .person-card {
            padding: 16px !important;
          }

          .person-top {
            gap: 10px !important;
          }

          .person-top h3 {
            font-size: 17px !important;
          }

          .mini-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }

          .mini-grid > div {
            min-width: 0 !important;
          }

          .panel-head {
            gap: 10px !important;
            flex-wrap: wrap !important;
          }

          .panel-head h2,
          .section-title,
          .panel h2 {
            font-size: 16px !important;
          }

          .content .recharts-responsive-container {
            max-width: 100% !important;
          }

          .content .recharts-wrapper,
          .content .recharts-surface {
            max-width: 100% !important;
          }

          .tx-table {
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .tx-table > * {
            min-width: 680px !important;
          }

          .table-head,
          .table-row {
            font-size: 12px !important;
          }

          .transaction-list {
            width: 100% !important;
            overflow: hidden !important;
          }

          .transaction-row,
          .report-transaction-row {
            min-height: 64px !important;
            padding: 10px 2px !important;
            gap: 10px !important;
          }

          .transaction-main,
          .report-transaction-main {
            min-width: 0 !important;
          }

          .transaction-main > div:last-child,
          .report-transaction-info {
            min-width: 0 !important;
          }

          .transaction-main strong,
          .report-transaction-info strong {
            max-width: 190px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .report-transaction-amount {
            min-width: 92px !important;
            font-size: 13px !important;
          }

          .form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .modal-backdrop {
            padding: 10px !important;
            align-items: flex-end !important;
          }

          .modal {
            width: 100% !important;
            max-width: 100% !important;
            max-height: calc(100dvh - 20px) !important;
            margin: 0 !important;
            border-radius: 22px 22px 16px 16px !important;
            overflow-y: auto !important;
          }

          .modal-head {
            position: sticky !important;
            top: 0 !important;
            z-index: 5 !important;
            background: #fff !important;
          }

          .modal-actions {
            position: sticky !important;
            bottom: 0 !important;
            background: rgba(255,255,255,.96) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            padding-top: 10px !important;
          }

          .modal-actions button {
            min-height: 46px !important;
          }

          .mobile-nav {
            left: 8px !important;
            right: 8px !important;
            bottom: calc(8px + env(safe-area-inset-bottom)) !important;
            padding: 7px !important;
            gap: 4px !important;
            border-radius: 19px !important;
          }

          .mobile-nav button {
            min-height: 54px !important;
            padding: 7px 2px !important;
            border-radius: 13px !important;
            gap: 3px !important;
            font-size: 9px !important;
            line-height: 1.1 !important;
          }

          .mobile-nav button svg {
            width: 18px !important;
            height: 18px !important;
          }

          .mobile-more-backdrop {
            position: fixed !important;
            inset: 0 !important;
            z-index: 1190 !important;
            background: rgba(18, 12, 28, .22) !important;
            backdrop-filter: blur(2px) !important;
            -webkit-backdrop-filter: blur(2px) !important;
          }

          .mobile-more-panel {
            position: fixed !important;
            left: 10px !important;
            right: 10px !important;
            bottom: calc(86px + env(safe-area-inset-bottom)) !important;
            z-index: 1210 !important;
            background: #fff !important;
            border: 1px solid rgba(124,58,237,.14) !important;
            border-radius: 20px !important;
            box-shadow: 0 20px 55px rgba(20,10,40,.22) !important;
            padding: 12px !important;
            max-height: min(68vh, 560px) !important;
            overflow-y: auto !important;
            animation: mobileMoreIn 180ms cubic-bezier(.22,1,.36,1) !important;
          }

          @keyframes mobileMoreIn {
            from { opacity: 0; transform: translateY(12px) scale(.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .mobile-more-title {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 7px 8px 11px !important;
          }

          .mobile-more-title strong {
            font-size: 16px !important;
          }

          .mobile-more-title span {
            font-size: 11px !important;
            color: #7b7285 !important;
          }

          .mobile-more-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }

          .mobile-more-item {
            display: flex !important;
            align-items: center !important;
            gap: 9px !important;
            min-height: 50px !important;
            padding: 9px 10px !important;
            border: 1px solid #eee7f7 !important;
            border-radius: 13px !important;
            background: #fff !important;
            color: #30263d !important;
            text-align: left !important;
            font: inherit !important;
            font-size: 12px !important;
            font-weight: 700 !important;
          }

          .mobile-more-item svg {
            flex: 0 0 auto !important;
            color: #6d28d9 !important;
          }

          .mobile-more-item.active {
            color: #6d28d9 !important;
            background: #f3ebff !important;
            border-color: rgba(124,58,237,.18) !important;
          }

          .mobile-more-close {
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
            padding: 0 !important;
            border-radius: 10px !important;
            border: 1px solid #eee7f7 !important;
            background: #fff !important;
          }

          .mobile-nav button.add {
            min-height: 58px !important;
            margin-top: -3px !important;
            margin-bottom: -3px !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 22px rgba(109,40,217,.28) !important;
          }

          /* Make dropdowns and controls finger-friendly. */
          input,
          select,
          textarea {
            min-height: 46px !important;
            font-size: 14px !important;
          }

          label {
            font-size: 12px !important;
          }

          button {
            -webkit-tap-highlight-color: transparent;
          }

          /* Notifications should fit the phone instead of overflowing. */
          .top-actions [style*="width: 370px"] {
            width: min(370px, calc(100vw - 28px)) !important;
            right: -4px !important;
            max-height: 70vh !important;
            overflow-y: auto !important;
          }

          /* Prevent long bank names / report text from widening the page. */
          .bank-card,
          .bank-waiting-row,
          .recurring-row {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .bank-card *,
          .bank-waiting-row *,
          .recurring-row * {
            min-width: 0 !important;
          }
        }

        @media (max-width: 390px) {
          .content {
            padding-left: 11px !important;
            padding-right: 11px !important;
          }

          .page-head h1 {
            font-size: 25px !important;
          }

          .mini-grid {
            gap: 9px !important;
          }

          .mobile-nav button {
            font-size: 8px !important;
          }
        }


        /* =========================================================
           FINAL MOBILE UI PASS
           Optimized for 320–430px phones
           ========================================================= */

        @media (max-width: 760px) {
          /* ---- Global phone geometry ---- */
          :root {
            --mobile-gutter: 14px;
            --mobile-radius: 16px;
          }

          html,
          body,
          #root,
          .app-shell {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            overflow-x: hidden !important;
          }

          body {
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
          }

          .app-shell .main {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 0 calc(104px + env(safe-area-inset-bottom)) !important;
            overflow-x: hidden !important;
          }

          /* ---- Header ---- */
          .topbar {
            height: 62px !important;
            min-height: 62px !important;
            width: 100% !important;
            padding: 8px 12px !important;
            gap: 8px !important;
            justify-content: space-between !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 1000 !important;
          }

          .mobile-brand {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }

          .mobile-brand b {
            font-size: 19px !important;
            line-height: 1 !important;
            letter-spacing: -.4px !important;
          }

          .mobile-brand span {
            display: block !important;
            margin-top: 3px !important;
            font-size: 8px !important;
            line-height: 1.1 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .top-actions {
            flex: 0 0 auto !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }

          /* Keep Refresh + Notifications + avatar visible on phones. */
          .top-actions .icon-btn:first-child {
            display: inline-flex !important;
          }

          .top-actions .icon-btn {
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
            padding: 0 !important;
            border-radius: 10px !important;
          }

          .top-actions .icon-btn svg {
            width: 16px !important;
            height: 16px !important;
          }

          .account-menu-wrap > button {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            padding: 0 !important;
            border-radius: 50% !important;
            overflow: hidden !important;
          }

          .account-menu-wrap > button .avatar,
          .account-menu-wrap > button img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }

          .top-actions > div[style*="position: relative"] {
            position: relative !important;
          }

          /* ---- Main content ---- */
          .content {
            width: 100% !important;
            max-width: 100% !important;
            padding: 18px var(--mobile-gutter) 0 !important;
            margin: 0 !important;
          }

          .page-head {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
            margin: 0 0 18px !important;
          }

          .page-head > div:first-child {
            width: 100% !important;
            min-width: 0 !important;
          }

          .eyebrow {
            font-size: 9px !important;
            line-height: 1.2 !important;
            letter-spacing: 1.35px !important;
            margin-bottom: 5px !important;
          }

          .page-head h1 {
            font-size: 25px !important;
            line-height: 1.12 !important;
            letter-spacing: -.65px !important;
            overflow-wrap: anywhere !important;
          }

          .page-head p {
            max-width: 100% !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
            margin: 6px 0 0 !important;
          }

          .page-head > button,
          .page-head .primary,
          .page-head button.primary {
            width: 100% !important;
            min-height: 48px !important;
            padding: 11px 14px !important;
            font-size: 14px !important;
            border-radius: 12px !important;
          }

          /* ---- Cards / grids ---- */
          .stats-grid,
          .people-grid,
          .two-col,
          .budget-grid,
          .goal-grid,
          .receipt-grid,
          .settings-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            width: 100% !important;
            gap: 12px !important;
            margin-bottom: 14px !important;
          }

          .settings-grid .panel:last-child {
            grid-column: auto !important;
          }

          .stat-card,
          .person-card,
          .panel,
          .budget-card,
          .goal-card,
          .receipt-card {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            border-radius: var(--mobile-radius) !important;
          }

          .stat-card {
            min-height: 100px !important;
            padding: 15px !important;
            gap: 12px !important;
          }

          .stat-icon {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            border-radius: 11px !important;
          }

          .stat-card span {
            font-size: 11px !important;
            line-height: 1.25 !important;
          }

          .stat-card strong {
            font-size: 21px !important;
            line-height: 1.15 !important;
            margin: 4px 0 3px !important;
            white-space: nowrap !important;
          }

          .stat-card small {
            font-size: 10px !important;
            line-height: 1.25 !important;
          }

          .person-card {
            padding: 15px !important;
          }

          .person-top {
            gap: 10px !important;
          }

          .person-top h3 {
            font-size: 16px !important;
            line-height: 1.25 !important;
          }

          .person-top span {
            font-size: 10px !important;
          }

          .avatar {
            width: 39px !important;
            height: 39px !important;
            min-width: 39px !important;
          }

          .mini-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px 8px !important;
            margin-top: 15px !important;
            padding-top: 13px !important;
          }

          .mini-grid small {
            font-size: 9px !important;
          }

          .mini-grid b {
            font-size: 12px !important;
            line-height: 1.25 !important;
          }

          .panel {
            padding: 15px !important;
          }

          .panel-head {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
            margin-bottom: 10px !important;
          }

          .panel-head h2,
          .panel h2 {
            font-size: 15px !important;
            line-height: 1.25 !important;
          }

          .panel-head span {
            font-size: 10px !important;
            line-height: 1.35 !important;
          }

          /* ---- Charts ---- */
          .two-col > .panel {
            min-width: 0 !important;
            overflow: hidden !important;
          }

          .recharts-responsive-container {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }

          .recharts-wrapper {
            max-width: 100% !important;
          }

          .recharts-surface {
            max-width: 100% !important;
            overflow: visible !important;
          }

          .recharts-legend-wrapper {
            max-width: 100% !important;
            font-size: 9px !important;
          }

          /* ---- Segmented / scope controls ---- */
          .segmented {
            width: 100% !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 4px !important;
            padding: 4px !important;
            margin-bottom: 14px !important;
            border-radius: 11px !important;
          }

          .segmented button {
            min-width: 0 !important;
            min-height: 40px !important;
            padding: 8px 5px !important;
            font-size: 11px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .scope-tabs {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
            margin-bottom: 14px !important;
          }

          .scope-tabs::-webkit-scrollbar {
            display: none !important;
          }

          .scope-tabs button {
            flex: 0 0 auto !important;
            min-height: 38px !important;
            padding: 8px 11px !important;
            font-size: 11px !important;
            white-space: nowrap !important;
          }

          /* ---- Transaction search/filter ---- */
          .toolbar {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 9px !important;
            margin-bottom: 12px !important;
          }

          .search {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 44px !important;
          }

          .search input {
            min-width: 0 !important;
            font-size: 13px !important;
          }

          /* ---- Transaction list ---- */
          .tx-list,
          .transaction-list {
            width: 100% !important;
            min-width: 0 !important;
          }

          .tx-row,
          .transaction-row {
            width: 100% !important;
            min-width: 0 !important;
            gap: 9px !important;
            padding: 11px 0 !important;
          }

          .tx-icon,
          .transaction-icon {
            width: 35px !important;
            height: 35px !important;
            min-width: 35px !important;
          }

          .tx-main,
          .transaction-main {
            min-width: 0 !important;
          }

          .tx-main b,
          .transaction-main strong,
          .transaction-main b {
            display: block !important;
            max-width: 100% !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .tx-main span,
          .transaction-main span {
            font-size: 9px !important;
            line-height: 1.3 !important;
          }

          .tx-row > strong,
          .transaction-row > strong {
            flex: 0 0 auto !important;
            font-size: 12px !important;
            white-space: nowrap !important;
          }

          /* ---- Transactions table: horizontal scroll, no broken columns ---- */
          .tx-table {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: thin !important;
          }

          .tx-table .table-head,
          .tx-table .table-row {
            min-width: 690px !important;
          }

          .table-head,
          .table-row {
            font-size: 11px !important;
          }

          .table-head {
            padding: 10px !important;
          }

          .table-row {
            min-height: 58px !important;
            padding: 10px !important;
          }

          /* ---- Forms ---- */
          form {
            gap: 12px !important;
          }

          .form-grid,
          .inline-form {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 11px !important;
          }

          .field-label,
          label {
            font-size: 11px !important;
            line-height: 1.25 !important;
          }

          input,
          select,
          textarea {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 45px !important;
            padding: 11px 12px !important;
            font-size: 14px !important;
            border-radius: 10px !important;
          }

          textarea {
            min-height: 90px !important;
            resize: vertical !important;
          }

          .person-picker {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }

          .person-option {
            min-height: 50px !important;
            padding: 9px 10px !important;
          }

          .person-option b {
            font-size: 11px !important;
          }

          .person-option small {
            font-size: 9px !important;
          }

          /* ---- Add/Edit modal ---- */
          .modal-backdrop {
            padding: 8px !important;
            align-items: flex-end !important;
          }

          .modal {
            width: 100% !important;
            max-width: 100% !important;
            max-height: calc(100dvh - 16px) !important;
            padding: 16px !important;
            border-radius: 20px 20px 14px 14px !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }

          .modal-head {
            gap: 8px !important;
            margin-bottom: 14px !important;
          }

          .modal-head h2 {
            font-size: 19px !important;
            line-height: 1.2 !important;
          }

          .modal-actions {
            display: grid !important;
            grid-template-columns: 1fr 1.35fr !important;
            gap: 8px !important;
            position: sticky !important;
            bottom: -16px !important;
            margin: 12px -16px -16px !important;
            padding: 10px 16px calc(10px + env(safe-area-inset-bottom)) !important;
            background: rgba(255,255,255,.96) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
          }

          .modal-actions button {
            width: 100% !important;
            min-height: 46px !important;
            font-size: 13px !important;
          }

          /* ---- Reports ---- */
          .report-controls {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 9px !important;
            align-items: stretch !important;
            justify-content: stretch !important;
          }

          .report-controls label {
            width: 100% !important;
            min-width: 0 !important;
          }

          .report-controls button {
            width: 100% !important;
            min-height: 44px !important;
            padding: 9px 8px !important;
            font-size: 11px !important;
          }

          .report-controls .primary {
            grid-column: 1 / -1 !important;
            min-height: 47px !important;
            font-size: 13px !important;
          }

          .report-transaction-row {
            min-height: 60px !important;
            gap: 8px !important;
            padding: 9px 0 !important;
          }

          .report-transaction-main {
            gap: 8px !important;
          }

          .report-transaction-icon {
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
            border-radius: 9px !important;
          }

          .report-transaction-info strong {
            font-size: 12px !important;
            max-width: 150px !important;
          }

          .report-transaction-info span {
            font-size: 9px !important;
          }

          .report-transaction-amount {
            min-width: 74px !important;
            font-size: 12px !important;
          }

          /* ---- Bank Balance ---- */
          .bank-waiting-row {
            display: grid !important;
            grid-template-columns: 36px minmax(0, 1fr) !important;
            row-gap: 7px !important;
            column-gap: 9px !important;
            min-height: auto !important;
            padding: 12px !important;
          }

          .bank-waiting-row .bank-waiting-title {
            font-size: 13px !important;
            white-space: nowrap !important;
          }

          .bank-waiting-row .bank-waiting-meta {
            font-size: 9px !important;
          }

          .bank-waiting-row .bank-waiting-amount {
            grid-column: 2 !important;
            text-align: left !important;
            font-size: 12px !important;
          }

          .bank-waiting-row select {
            grid-column: 2 !important;
            min-height: 42px !important;
            font-size: 12px !important;
          }

          /* Generic bank/recurring rows: stack safely on narrow screens. */
          .recurring-row {
            min-height: 62px !important;
            padding: 11px !important;
            gap: 9px !important;
            overflow: hidden !important;
          }

          .recurring-row strong {
            font-size: 13px !important;
            line-height: 1.25 !important;
          }

          .recurring-row span,
          .recurring-row small {
            font-size: 9px !important;
            line-height: 1.3 !important;
          }

          /* ---- Budgets / goals / receipts / settings ---- */
          .budget-card,
          .goal-card,
          .receipt-card {
            padding: 15px !important;
          }

          .budget-card strong,
          .goal-card strong {
            font-size: 19px !important;
          }

          .goal-symbol {
            font-size: 22px !important;
          }

          .receipt-placeholder {
            height: 105px !important;
          }

          .setting-row {
            gap: 12px !important;
            padding: 12px 0 !important;
          }

          .setting-row > div {
            min-width: 0 !important;
          }

          .setting-row strong {
            font-size: 12px !important;
          }

          .setting-row span {
            font-size: 9px !important;
            line-height: 1.35 !important;
          }

          /* ---- Settlements / history ---- */
          .settle-people {
            gap: 8px !important;
            font-size: 10px !important;
            flex-wrap: wrap !important;
          }

          .settlement {
            padding: 15px !important;
          }

          .settlement strong {
            font-size: 17px !important;
          }

          .history-row {
            gap: 10px !important;
            font-size: 10px !important;
          }

          /* ---- More drawer ---- */
          .mobile-more-panel {
            left: 8px !important;
            right: 8px !important;
            bottom: calc(82px + env(safe-area-inset-bottom)) !important;
            max-height: min(70dvh, 560px) !important;
            padding: 11px !important;
            border-radius: 19px !important;
          }

          .mobile-more-title {
            padding: 6px 7px 10px !important;
          }

          .mobile-more-title strong {
            font-size: 15px !important;
          }

          .mobile-more-title span {
            font-size: 10px !important;
          }

          .mobile-more-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 7px !important;
          }

          .mobile-more-item {
            min-height: 47px !important;
            padding: 8px !important;
            gap: 7px !important;
            border-radius: 12px !important;
            font-size: 11px !important;
          }

          .mobile-more-item svg {
            width: 16px !important;
            height: 16px !important;
          }

          /* ---- Bottom navigation ---- */
          .mobile-nav {
            left: 7px !important;
            right: 7px !important;
            bottom: calc(7px + env(safe-area-inset-bottom)) !important;
            min-height: 64px !important;
            padding: 6px !important;
            gap: 3px !important;
            border-radius: 18px !important;
            box-shadow: 0 12px 35px rgba(20,10,40,.18) !important;
          }

          .mobile-nav button {
            min-height: 51px !important;
            padding: 6px 2px !important;
            border-radius: 12px !important;
            gap: 3px !important;
            font-size: 8px !important;
            line-height: 1.05 !important;
          }

          .mobile-nav button svg {
            width: 17px !important;
            height: 17px !important;
          }

          .mobile-nav button.add {
            min-height: 55px !important;
            margin-top: -3px !important;
            margin-bottom: -3px !important;
            border-radius: 15px !important;
          }

          /* ---- Notifications / account dropdown ---- */
          .top-actions [style*="width: 370px"] {
            position: absolute !important;
            right: -4px !important;
            top: calc(100% + 8px) !important;
            width: min(350px, calc(100vw - 24px)) !important;
            max-width: calc(100vw - 24px) !important;
            max-height: 70dvh !important;
            overflow-y: auto !important;
          }

          .account-menu-wrap > div {
            max-width: calc(100vw - 24px) !important;
          }

          /* ---- Toast ---- */
          .toast {
            left: 12px !important;
            right: 12px !important;
            bottom: calc(80px + env(safe-area-inset-bottom)) !important;
            width: auto !important;
            max-width: none !important;
            font-size: 11px !important;
            padding: 10px 12px !important;
            border-radius: 11px !important;
          }

          /* Disable desktop hover movement on touch devices. */
          .card:hover,
          .stat-card:hover,
          .person-card:hover,
          .recent-item:hover,
          .recurring-row:hover,
          .bank-card:hover,
          .goal-card:hover,
          .budget-card:hover,
          .setting-card:hover,
          .primary:hover,
          .secondary:hover,
          .icon-btn:hover {
            transform: none !important;
            box-shadow: inherit !important;
          }
        }

        @media (max-width: 360px) {
          .content {
            padding-left: 11px !important;
            padding-right: 11px !important;
          }

          .page-head h1 {
            font-size: 23px !important;
          }

          .mobile-nav button {
            font-size: 7px !important;
          }

          .mobile-nav button svg {
            width: 16px !important;
            height: 16px !important;
          }

          .stat-card strong {
            font-size: 19px !important;
          }
        }

        .app-shell .sidebar {
          width: var(--sidebar-width) !important;
          min-width: var(--sidebar-width) !important;
          max-width: var(--sidebar-width) !important;
          transition: width 180ms ease, min-width 180ms ease;
        }

        .app-shell .main {
          margin-left: var(--sidebar-width) !important;
          width: calc(100% - var(--sidebar-width)) !important;
          min-width: 0;
          transition: margin-left 180ms ease, width 180ms ease;
        }

        .sidebar-toggle {
          transition: all 180ms ease;
        }

        @media (max-width: 1000px) and (min-width: 761px) {
          .app-shell {
            --sidebar-width: 210px;
          }

          .app-shell.sidebar-is-collapsed {
            --sidebar-width: 76px;
          }
        }

        @media (max-width: 760px) {
          .app-shell,
          .app-shell.sidebar-is-collapsed {
            --sidebar-width: 0px;
          }

          .app-shell .sidebar {
            display: none !important;
          }

          .app-shell .main {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      <Sidebar
        page={page}
        setPage={setPage}
        openAdd={() => openAdd()}
        profiles={profiles}
        collapsed={sidebarCollapsed}
        onToggle={() =>
          setSidebarCollapsed((value) => !value)
        }
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


            <div
              style={{
                position: "relative"
              }}
            >
              <button
                type="button"
                className="icon-btn"
                aria-label="Notifications"
                title="Notifications and reminders"
                onClick={() => {
                  setShowNotifications((value) => !value);
                  setShowAccountMenu(false);
                }}
                style={{
                  position: "relative"
                }}
              >
                <Bell size={18} />

                {notificationCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#7c3aed",
                      border: "2px solid white"
                    }}
                  />
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 10px)",
                    width: 370,
                    maxWidth: "calc(100vw - 24px)",
                    background: "#fff",
                    border: "1px solid #e8e1f1",
                    borderRadius: 16,
                    boxShadow: "0 18px 50px rgba(20,10,40,.18)",
                    zIndex: 1100,
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      padding: "16px 16px 12px",
                      borderBottom: "1px solid #eee7f7"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10
                      }}
                    >
                      <div>
                        <b style={{ fontSize: 16 }}>
                          Notifications
                        </b>
                        <small
                          style={{
                            display: "block",
                            marginTop: 3,
                            color: "#7b7285",
                            fontSize: 11
                          }}
                        >
                          Account activity & reminders
                        </small>
                      </div>

                      <button
                        type="button"
                        className="secondary"
                        onClick={enableBrowserNotifications}
                        style={{
                          padding: "7px 10px",
                          fontSize: 11
                        }}
                      >
                        <Bell size={14} />
                        Enable alerts
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: 330,
                      overflowY: "auto"
                    }}
                  >
                    {notificationItems.length === 0 ? (
                      <div
                        style={{
                          padding: 24,
                          textAlign: "center"
                        }}
                      >
                        <CheckCircle2
                          size={28}
                          color="#7c3aed"
                        />

                        <b
                          style={{
                            display: "block",
                            marginTop: 8
                          }}
                        >
                          All caught up
                        </b>

                        <small
                          style={{
                            display: "block",
                            marginTop: 4,
                            color: "#7b7285"
                          }}
                        >
                          No reminders or recent activity.
                        </small>
                      </div>
                    ) : (
                      notificationItems
                        .slice(0, 12)
                        .map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #f1edf5",
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start"
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background:
                                  item.kind === "reminder"
                                    ? "#f0e7ff"
                                    : "#f7f4fb",
                                color: "#6d28d9",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0
                              }}
                            >
                              {item.kind === "reminder" ? (
                                <Clock size={17} />
                              ) : (
                                <Bell size={17} />
                              )}
                            </div>

                            <div
                              style={{
                                minWidth: 0,
                                flex: 1
                              }}
                            >
                              <b
                                style={{
                                  display: "block",
                                  fontSize: 13,
                                  lineHeight: 1.35
                                }}
                              >
                                {item.title}
                              </b>

                              <small
                                style={{
                                  display: "block",
                                  marginTop: 3,
                                  color: "#7b7285",
                                  fontSize: 11,
                                  lineHeight: 1.35
                                }}
                              >
                                {item.text}
                              </small>

                              <small
                                style={{
                                  display: "block",
                                  marginTop: 4,
                                  color: "#9a91a5",
                                  fontSize: 10
                                }}
                              >
                                {item.date
                                  ? new Date(
                                      item.date
                                    ).toLocaleString(
                                      "en-IN",
                                      {
                                        dateStyle: "medium",
                                        timeStyle: "short"
                                      }
                                    )
                                  : ""}
                              </small>
                            </div>

                            {item.kind === "reminder" && (
                              <button
                                type="button"
                                className="icon-btn"
                                title="Complete reminder"
                                onClick={() =>
                                  completeReminder(
                                    item.id
                                  )
                                }
                                style={{
                                  width: 32,
                                  height: 32,
                                  flexShrink: 0
                                }}
                              >
                                <Check size={15} />
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </div>

                  <div
                    style={{
                      padding: 12,
                      background: "#faf8fd",
                      borderTop: "1px solid #eee7f7"
                    }}
                  >
                    {!showReminderForm ? (
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          setShowReminderForm(true);
                          if (!reminderAt) {
                            setReminderAt(
                              reminderInputValue()
                            );
                          }
                        }}
                        style={{
                          width: "100%",
                          justifyContent: "center"
                        }}
                      >
                        <Plus size={16} />
                        Add Reminder
                      </button>
                    ) : (
                      <div>
                        <div
                          style={{
                            display: "grid",
                            gap: 8
                          }}
                        >
                          <input
                            value={reminderTitle}
                            onChange={(e) =>
                              setReminderTitle(
                                e.target.value
                              )
                            }
                            placeholder="Reminder title"
                            autoFocus
                          />

                          <input
                            value={reminderNote}
                            onChange={(e) =>
                              setReminderNote(
                                e.target.value
                              )
                            }
                            placeholder="Note (optional)"
                          />

                          <input
                            type="datetime-local"
                            value={reminderAt}
                            onChange={(e) =>
                              setReminderAt(
                                e.target.value
                              )
                            }
                          />

                          <div
                            style={{
                              display: "flex",
                              gap: 8
                            }}
                          >
                            <button
                              type="button"
                              className="primary"
                              onClick={addReminder}
                              disabled={reminderBusy}
                              style={{
                                flex: 1,
                                justifyContent:
                                  "center"
                              }}
                            >
                              <Check size={15} />
                              {reminderBusy
                                ? "Saving..."
                                : "Save Reminder"}
                            </button>

                            <button
                              type="button"
                              className="secondary"
                              onClick={
                                resetReminderForm
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {reminders.filter(
                      (r) => !r.completed
                    ).length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop:
                            "1px solid #eee7f7"
                        }}
                      >
                        <small
                          style={{
                            color: "#7b7285",
                            fontSize: 10
                          }}
                        >
                          Your reminders
                        </small>

                        {reminders
                          .filter(
                            (r) => !r.completed
                          )
                          .slice(0, 5)
                          .map((r) => (
                            <div
                              key={r.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginTop: 7
                              }}
                            >
                              <Clock
                                size={13}
                                color="#7c3aed"
                              />

                              <span
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  fontSize: 11,
                                  whiteSpace:
                                    "nowrap",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis"
                                }}
                              >
                                {r.title}
                              </span>

                              <button
                                type="button"
                                className="icon-btn"
                                title="Delete reminder"
                                onClick={() =>
                                  deleteReminder(
                                    r.id
                                  )
                                }
                                style={{
                                  width: 27,
                                  height: 27
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>


            <div
              className="account-menu-wrap"
              style={{ position: "relative" }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu((value) => !value);
                  setShowNotifications(false);
                }}
                aria-label="Open account menu"
                title="Account menu"
                style={{
                  width: 42,
                  height: 42,
                  padding: 0,
                  borderRadius: "50%",
                  border: showAccountMenu
                    ? "2px solid #7c3aed"
                    : "1px solid #e5e7eb",
                  background: "#efe6ff",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: showAccountMenu
                    ? "0 0 0 4px rgba(124,58,237,.10)"
                    : "none",
                  transition: "all 160ms ease"
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Account"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <UserCircle size={25} color="#6d28d9" />
                )}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "4px 2px 14px",
                      marginBottom: 10,
                      borderBottom: "1px solid #eee7f7"
                    }}
                  >
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
                        flexShrink: 0
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Account"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      ) : (
                        <UserCircle size={28} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <b
                        style={{
                          display: "block",
                          fontSize: 14,
                          lineHeight: 1.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {profiles[0]?.name || settings?.person_one_name || "Santhosh"}
                        {" & "}
                        {profiles[1]?.name || settings?.person_two_name || "Sindhuja"}
                      </b>

                      <small
                        style={{
                          display: "block",
                          marginTop: 3,
                          fontSize: 11,
                          color: "#7b7285",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {session?.user?.email || "Shared account"}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setPage("settings");
                    }}
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      marginBottom: 8,
                      gap: 10
                    }}
                  >
                    <Settings size={17} />
                    Settings
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setPage("settings");
                    }}
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      marginBottom: 8,
                      gap: 10
                    }}
                  >
                    <Camera size={17} />
                    Change profile picture
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      gap: 10,
                      color: "#dc2626"
                    }}
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
        <button
          className={showMobileMenu ? "active" : ""}
          onClick={() => setShowMobileMenu((open) => !open)}
          aria-expanded={showMobileMenu}
          aria-label="Open dashboard navigation"
        >
          <Settings size={19} />
          More
        </button>
      </nav>

      {showMobileMenu && (
        <>
          <div
            className="mobile-more-backdrop"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />

          <div className="mobile-more-panel" role="dialog" aria-label="Dashboard navigation">
            <div className="mobile-more-title">
              <div>
                <strong>Dashboard</strong>
                <div><span>Navigate to any section</span></div>
              </div>
              <button
                className="mobile-more-close"
                onClick={() => setShowMobileMenu(false)}
                aria-label="Close dashboard navigation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-more-grid">
              {[
                ["overview", "Overview", LayoutDashboard],
                ["person1", profiles[0]?.name || "Person 1", UserRound],
                ["person2", profiles[1]?.name || "Person 2", UserRound],
                ["shared", "Shared", UsersRound],
                ["transactions", "Transactions", Receipt],
                ["analytics", "Analytics", BarChart3],
                ["budgets", "Budgets", Target],
                ["savings", "Savings Goals", PiggyBank],
                ["recurring", "Recurring", Repeat2],
                ["bankbalance", "Bank Balance", Landmark],
                ["receipts", "Receipts", Receipt],
                ["reports", "Reports", FileText],
                ["settings", "Settings", Settings]
              ].map(([key, label, Icon]) => (
                <button
                  key={key}
                  className={`mobile-more-item ${page === key ? "active" : ""}`}
                  onClick={() => {
                    setPage(key);
                    setShowMobileMenu(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

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
          sortAndDedupeBanks(
            bankAccounts.filter((bank) => {
              if (transaction.type === "shared_expense") {
                return bank.profile_id === transaction.shared_paid_by;
              }

              return bank.profile_id === transaction.profile_id;
            })
          );

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
                  <div className="recurring-row bank-waiting-row" key={t.id}>
                    <div className="tx-icon">
                      {(() => {
                        const I = transactionIcon(t);
                        return <I size={18} />;
                      })()}
                    </div>

                    <div>
                      <b className="bank-waiting-title">
                        {transactionLabel(t)}
                      </b>
                      <span className="bank-waiting-meta">
                        {person} · {localDateKey(t.transaction_date)}
                      </span>
                    </div>

                    <div>
                      <strong className="bank-waiting-amount">
                        {money(t.amount)}
                      </strong>
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
                      aria-label={`Select bank for ${transactionLabel(t)}`}
                    >
                      <option value="">
                        {options.length ? "Select bank" : "No bank available"}
                      </option>
                      {options.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {canonicalBankName(bank.bank_name)}
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
                    <b>{canonicalBankName(bank.bank_name)}</b>
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
  profiles,
  collapsed,
  onToggle
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
    <aside
      className="sidebar"
      style={{
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >

      <div
        className="side-brand"
        style={{
          position: "relative",
          paddingRight: collapsed ? 4 : 44
        }}
      >

        <strong>
          US <span>💜</span>
        </strong>

        {!collapsed && (
          <small>
            We Spent but We Saved
          </small>
        )}

        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            right: collapsed ? 2 : 0,
            top: 0,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#6d28d9",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            zIndex: 10
          }}
        >
          {collapsed ? (
            <ChevronRight size={17} />
          ) : (
            <ChevronLeft size={17} />
          )}
        </button>

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
              title={collapsed ? label : undefined}
              aria-label={label}
              onClick={() =>
                setPage(id)
              }
              style={{
                width: collapsed ? "52px" : "100%",
                minWidth: collapsed ? "52px" : 0,
                alignSelf: collapsed ? "center" : undefined,
                justifyContent: collapsed ? "center" : undefined,
                paddingLeft: collapsed ? 0 : undefined,
                paddingRight: collapsed ? 0 : undefined
              }}
            >
              <I size={18} />
              {!collapsed && label}
            </button>
          )
        )}

      </nav>


      <button
        className="side-add"
        onClick={openAdd}
        title={collapsed ? "Add Transaction" : undefined}
        aria-label="Add Transaction"
        style={{
          width: collapsed ? "52px" : "100%",
          minWidth: collapsed ? "52px" : 0,
          alignSelf: collapsed ? "center" : undefined,
          justifyContent: collapsed ? "center" : undefined,
          paddingLeft: collapsed ? 0 : undefined,
          paddingRight: collapsed ? 0 : undefined
        }}
      >
        <Plus size={19} />
        {!collapsed && "Add Transaction"}
      </button>


      {!collapsed && (
        <div className="side-footer">
          <small>
            Your money, together.
          </small>
        </div>
      )}

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
              <Bar dataKey="value" name="Expenses" radius={[6, 6, 0, 0]}>
                {weekDays.map((entry, index) => (
                  <Cell
                    key={`week-bar-${entry.label}`}
                    fill={ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]}
                  />
                ))}
              </Bar>
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
              <Line
                type="monotone"
                dataKey="value"
                name="Expenses"
                stroke="#7C3AED"
                strokeWidth={3}
                dot={{ r: 5, fill: "#7C3AED", stroke: "#FFFFFF", strokeWidth: 2 }}
                activeDot={{ r: 7, fill: "#7C3AED", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
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
          transactionIcon(t);

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
                {transactionLabel(t)}
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

              {t.type === "income" || t.type === "savings"
                ? "+"
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
// BANK DISPLAY HELPERS
// ============================================================

const BANK_DISPLAY_ORDER = ["BOB", "Canara Bank", "SBI"];

const canonicalBankName = (name = "") => {
  const value = String(name).trim().toLowerCase();

  if (
    value === "bob" ||
    value === "bank of baroda" ||
    value === "bank of baroda (bob)"
  ) {
    return "BOB";
  }

  if (value === "canara" || value === "canara bank") {
    return "Canara Bank";
  }

  if (value === "sbi" || value === "state bank of india") {
    return "SBI";
  }

  return String(name).trim();
};

const bankDisplayRank = (name) => {
  const canonical = canonicalBankName(name);
  const index = BANK_DISPLAY_ORDER.indexOf(canonical);
  return index === -1 ? BANK_DISPLAY_ORDER.length : index;
};

const sortAndDedupeBanks = (banks = []) => {
  const seen = new Set();

  return [...banks]
    .sort((a, b) => {
      const rankDiff =
        bankDisplayRank(a.bank_name) - bankDisplayRank(b.bank_name);

      if (rankDiff !== 0) return rankDiff;

      return String(a.bank_name).localeCompare(
        String(b.bank_name),
        undefined,
        { sensitivity: "base" }
      );
    })
    .filter((bank) => {
      const canonical = canonicalBankName(bank.bank_name);

      // If both "BOB" and "Bank of Baroda" exist, show only BOB in
      // dropdowns. Prefer the actual BOB record when possible.
      if (seen.has(canonical)) return false;
      seen.add(canonical);
      return true;
    });
};

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

  const availableBanks = sortAndDedupeBanks(
    bankAccounts.filter((b) => {
      if (profile === "shared" && type === "expense") {
        return b.profile_id === paidBy;
      }

      if (profile === "shared") {
        return true;
      }

      return b.profile_id === profile;
    })
  );

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
                  {canonicalBankName(b.bank_name)} ·{" "}
                  {b.account_type || "Bank Account"}
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
                  stroke="#7C3AED"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#7C3AED", stroke: "#FFFFFF", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#7C3AED", stroke: "#FFFFFF", strokeWidth: 2 }}
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
                className="transaction-row report-transaction-row"
                key={t.id}
              >
                <div className="transaction-main report-transaction-main">
                  <div className="transaction-icon report-transaction-icon">
                    {(() => {
                      const I = transactionIcon(t);
                      return <I size={18} />;
                    })()}
                  </div>

                  <div className="report-transaction-info">
                    <strong>
                      {transactionLabel(t)}
                    </strong>

                    <span>
                      {personName(t)} · {localDateKey(t.transaction_date)}
                    </span>
                  </div>
                </div>

                <strong
                  className={`report-transaction-amount ${
                    t.type === "income" || t.type === "savings"
                      ? "money-positive"
                      : "money-negative"
                  }`}
                >
                  {t.type === "income" || t.type === "savings"
                    ? "+"
                    : "−"}{" "}
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