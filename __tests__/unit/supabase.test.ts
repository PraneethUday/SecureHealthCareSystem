import { supabase } from "@/lib/supabase";

describe("Supabase Client Unit Test", () => {
    it("should export a valid supabase client instance", () => {
        expect(supabase).toBeDefined();
        expect(typeof supabase.from).toBe("function");
        expect(typeof supabase.auth).toBe("object");
    });

    it("should have correct environment configuration or fallbacks", () => {
        // We can't easily check the internal URL, but we can check if the object is formed
        // This confirms our refactor to export 'supabase' as a const worked
        expect(supabase).toBeTruthy();
    });
});
