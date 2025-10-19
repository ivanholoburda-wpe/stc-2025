import React, { useState, useEffect, useCallback } from 'react';
import Graph from 'react-graph-vis';
import { getTopology } from '../../api/topology';

const graphOptions = {
    layout: {
        hierarchical: false,
    },
    edges: {
        color: '#4A5568',
        arrows: {
            to: { enabled: false },
        },
        smooth: {
            enabled: true,
            type: 'dynamic',
            roundness: 0.5
        }
    },
    nodes: {
        shape: 'dot',
        size: 22,
        font: {
            size: 14,
            color: '#E2E8F0',
        },
        borderWidth: 2.5,
        color: {
            border: '#4FD1C5',
            background: '#2D3748',
            highlight: {
                border: '#81E6D9',
                background: '#4A5568',
            },
        },
    },
    physics: {
        enabled: true,
        barnesHut: {
            gravitationalConstant: -30000,
            springConstant: 0.05,
            springLength: 200,
        },
    },
    interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        hover: true,
    },
    height: '100%',
};

export function TopologyView() {
    const [topology, setTopology] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLatestTopology = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const topologyResult = await getTopology();

            if (topologyResult.success) {
                setTopology(topologyResult.data);
            } else {
                setError(topologyResult.error || "Failed to fetch topology data.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLatestTopology();
    }, [fetchLatestTopology]);


    return (
        <div className="h-full flex flex-col p-6 bg-gray-800 text-gray-200">
            <div className="flex-1 bg-gray-900 rounded-lg shadow-inner relative">
                {loading && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading topology...</div>}
                {error && <div className="absolute inset-0 flex items-center justify-center text-red-400">{error}</div>}
                {!loading && !error && topology && (
                    <Graph
                        key={Date.now()}
                        graph={topology}
                        options={graphOptions}
                    />
                )}
                {!loading && !topology && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        No topology data available.
                    </div>
                )}
            </div>
        </div>
    );
}

