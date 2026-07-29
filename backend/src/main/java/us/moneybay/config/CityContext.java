package us.moneybay.config;

public final class CityContext {
    private static final ThreadLocal<String> CURRENT_SUBDOMAIN = new ThreadLocal<>();

    private CityContext() {}

    public static void setSubdomain(String subdomain) {
        CURRENT_SUBDOMAIN.set(subdomain);
    }

    public static String getSubdomain() {
        return CURRENT_SUBDOMAIN.get();
    }

    public static void clear() {
        CURRENT_SUBDOMAIN.remove();
    }
}
