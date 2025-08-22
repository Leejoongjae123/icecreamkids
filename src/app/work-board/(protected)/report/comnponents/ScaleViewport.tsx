'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

interface ScaleViewportProps {
	children: ReactNode;
}

/**
 * Viewport scale wrapper for report page
 * - Scales down only when viewport width is between 1920 and 1440
 * - Keeps scale 1 when >=1920 or <=1440
 */
export default function ScaleViewport({ children }: ScaleViewportProps) {
	const [viewportWidth, setViewportWidth] = useState<number>(
		typeof window !== 'undefined' ? window.innerWidth : 1920
	);

	useEffect(() => {
		const handleResize = () => {
			setViewportWidth(window.innerWidth);
		};
		handleResize();
		window.addEventListener('resize', handleResize, { passive: true } as EventListenerOptions);
		return () => {
			window.removeEventListener('resize', handleResize as unknown as EventListener);
		};
	}, []);

	const { scale, baseWidth } = useMemo(() => {
		if (viewportWidth < 1440) {
			return { scale: 1, baseWidth: 1440 } as const;
		}
		if (viewportWidth >= 1920) {
			return { scale: 1, baseWidth: 1920 } as const;
		}
		return { scale: viewportWidth / 1920, baseWidth: 1920 } as const;
	}, [viewportWidth]);

	return (
		<div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
			<div
				style={{
					width: `${baseWidth}px`,
					transform: `scale(${scale})`,
					transformOrigin: 'top center',
				}}
			>
				{children}
			</div>
		</div>
	);
}
