declare module 'react-simple-maps' {
    import * as React from 'react';

    export interface ComposableMapProps {
        width?: number;
        height?: number;
        projection?: string | ((width: number, height: number, config: any) => any);
        projectionConfig?: any;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    }

    export const ComposableMap: React.FC<ComposableMapProps>;

    export interface GeographiesProps {
        geography?: string | Record<string, any>;
        children: (args: { geographies: any[]; projection: any; path: any }) => React.ReactNode;
    }

    export const Geographies: React.FC<GeographiesProps>;

    export interface GeographyProps {
        geography: any;
        fill?: string;
        stroke?: string;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        onClick?: (event: React.MouseEvent, geography: any) => void;
    }

    export const Geography: React.FC<GeographyProps>;

    export interface MarkerProps {
        coordinates: [number, number];
        children?: React.ReactNode;
        onClick?: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
        onMouseEnter?: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
        onMouseLeave?: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
        style?: {
            default?: React.CSSProperties;
            hover?: React.CSSProperties;
            pressed?: React.CSSProperties;
        };
        className?: string;
        key?: any;
    }

    export const Marker: React.FC<MarkerProps>;
}
