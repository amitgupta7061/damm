"use client";
import React from 'react';

export default function ExitModal({ isOpen, onClose, onSave, onLeaveWithoutSaving }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div className="modal-content" style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-lg)', padding: '28px', maxWidth: '400px', width: '90%',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <h3 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: '600' }}>Save before exiting?</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
                    If you leave without saving, any newly drawn elements or edits might be lost permanently.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className="btn-primary" onClick={onSave}>
                        💾 Save to Dashboard
                    </button>
                    <button 
                        className="btn-secondary danger-outline" 
                        style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)' }} 
                        onClick={onLeaveWithoutSaving}
                    >
                        Leave without saving
                    </button>
                    <button className="btn-secondary" onClick={onClose} style={{ marginTop: '8px', border: 'none', opacity: 0.7 }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
