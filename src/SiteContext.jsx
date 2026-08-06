import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api, { getErrorMessage } from "./api";

const SiteContext = createContext();

export function SiteProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/sites");
      const activeSites = (res.data.data || []).filter((s) => s.is_active);
      setSites(activeSites);
      if (activeSites.length > 0 && !selectedSiteId) {
        setSelectedSiteId(activeSites[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar site."));
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || null;

  return (
    <SiteContext.Provider
      value={{
        sites,
        selectedSiteId,
        setSelectedSiteId,
        selectedSite,
        loading,
        error,
        refetchSites: fetchSites,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
