/**
 * Component Tests for components/theme-provider.tsx
 * Tests ThemeProvider component functionality
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";

// Mock next-themes
jest.mock("next-themes", () => ({
    ThemeProvider: ({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
        <div data-testid="mock-theme-provider" data-props={JSON.stringify(props)}>
            {children}
        </div>
    )
}));

describe("ThemeProvider Component Tests", () => {
    it("should render children correctly", () => {
        render(
            <ThemeProvider>
                <div data-testid="child-element">Hello World</div>
            </ThemeProvider>
        );

        const childElement = screen.getByTestId("child-element");
        expect(childElement).toBeInTheDocument();
        expect(childElement).toHaveTextContent("Hello World");
    });

    it("should render multiple children", () => {
        render(
            <ThemeProvider>
                <div data-testid="child-1">Child 1</div>
                <div data-testid="child-2">Child 2</div>
            </ThemeProvider>
        );

        expect(screen.getByTestId("child-1")).toBeInTheDocument();
        expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });

    it("should pass props to NextThemesProvider", () => {
        render(
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <div>Content</div>
            </ThemeProvider>
        );

        const mockProvider = screen.getByTestId("mock-theme-provider");
        const props = JSON.parse(mockProvider.getAttribute("data-props") || "{}");

        expect(props.attribute).toBe("class");
        expect(props.defaultTheme).toBe("system");
        expect(props.enableSystem).toBe(true);
        expect(props.disableTransitionOnChange).toBe(true);
    });

    it("should pass custom theme values", () => {
        render(
            <ThemeProvider
                themes={["light", "dark", "custom"]}
                defaultTheme="custom"
            >
                <div>Content</div>
            </ThemeProvider>
        );

        const mockProvider = screen.getByTestId("mock-theme-provider");
        const props = JSON.parse(mockProvider.getAttribute("data-props") || "{}");

        expect(props.themes).toEqual(["light", "dark", "custom"]);
        expect(props.defaultTheme).toBe("custom");
    });

    it("should render without any props", () => {
        render(
            <ThemeProvider>
                <span>Minimal setup</span>
            </ThemeProvider>
        );

        expect(screen.getByText("Minimal setup")).toBeInTheDocument();
    });

    it("should handle storageKey prop", () => {
        render(
            <ThemeProvider storageKey="healthcare-theme">
                <div>Content</div>
            </ThemeProvider>
        );

        const mockProvider = screen.getByTestId("mock-theme-provider");
        const props = JSON.parse(mockProvider.getAttribute("data-props") || "{}");

        expect(props.storageKey).toBe("healthcare-theme");
    });

    it("should handle forcedTheme prop", () => {
        render(
            <ThemeProvider forcedTheme="dark">
                <div>Forced dark mode</div>
            </ThemeProvider>
        );

        const mockProvider = screen.getByTestId("mock-theme-provider");
        const props = JSON.parse(mockProvider.getAttribute("data-props") || "{}");

        expect(props.forcedTheme).toBe("dark");
    });

    it("should render nested components", () => {
        const NestedComponent = () => (
            <div data-testid="nested">
                <span>Nested content</span>
            </div>
        );

        render(
            <ThemeProvider>
                <NestedComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId("nested")).toBeInTheDocument();
        expect(screen.getByText("Nested content")).toBeInTheDocument();
    });
});
