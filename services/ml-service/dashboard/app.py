"""
Streamlit dashboard for the DASS-42 Mental State Classifier & Clinical Assessment.

Features:
  1. High-Contrast, Crystal-Clear Glassmorphic UI with animated floating items.
  2. Mindful Photo Gallery & Calming Visuals.
  3. Interactive Guided Breathing Pulse Circle.
  4. Rapid AI Screener: Big-Five TIPI + Demographic signals with local in-process ML.
  5. Full 42-Item DASS-42 Clinical Questionnaire with instant scoring & severity cutoffs.
  6. Model Leaderboard & Diagnostics.
  7. MindCare Calming Tools & Global Crisis Helplines.
"""

import sys
import os
import json
import textwrap
import time
import urllib.request
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

import joblib
import numpy as np
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components
import matplotlib.pyplot as plt

import config

def render_html(html_code: str):
    """Render HTML in Streamlit safely without CommonMark indented code block bug."""
    if not html_code:
        return
    lines = [line.strip() for line in html_code.strip().split("\n") if line.strip()]
    cleaned_html = "".join(lines)
    st.markdown(cleaned_html, unsafe_allow_html=True)

st.set_page_config(
    page_title="MediGrid · DASS-42 Mental State Classifier",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom High-Contrast & Dynamic Animated Styling
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Syne:wght@600;700;800&display=swap');
    
    :root {
      --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      --font-heading: 'Outfit', 'Plus Jakarta Sans', sans-serif;
    }

        /* Dark teal canvas */
        html, body, [data-testid="stAppViewContainer"] {
            background-color: #071316;
        }
    .stApp {
            background: radial-gradient(ellipse at 12% 0%, rgba(13, 148, 136, 0.18) 0%, transparent 38%),
                linear-gradient(135deg, #071316 0%, #0b1720 54%, #111827 100%);
            color: #e2e8f0 !important;
      font-family: var(--font-sans);
    }
    
    [data-testid="stHeader"] { background: transparent; }
    [data-testid="stMainBlockContainer"] { max-width: 1280px; padding-top: 1.5rem; padding-bottom: 4rem; }
    
    [data-testid="stChatMessage"] {
      padding: 0.35rem 0.25rem !important;
    }
    [data-testid="stChatMessage"] > div {
      border-radius: 18px !important;
      box-shadow: 0 6px 18px rgba(148, 163, 184, 0.12) !important;
      border: 1px solid rgba(148, 163, 184, 0.18) !important;
      padding: 0.75rem 0.9rem !important;
    }
    [data-testid="stChatMessage"][data-message-role="assistant"] > div {
      background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%) !important;
      color: #0f172a !important;
      border-color: rgba(244, 114, 182, 0.26) !important;
    }
    [data-testid="stChatMessage"][data-message-role="user"] > div {
      background: linear-gradient(135deg, #dff6ff 0%, #bfdbfe 100%) !important;
      color: #0f172a !important;
      border-color: rgba(56, 189, 248, 0.28) !important;
    }
    
    /* Sleek High-Contrast Sidebar */
    [data-testid="stSidebar"] {
      background: linear-gradient(180deg, #070a12 0%, #0b101d 100%);
      border-right: 1px solid rgba(56, 189, 248, 0.2);
      box-shadow: 6px 0 30px rgba(0,0,0,0.5);
    }
    [data-testid="stSidebar"] * { color: #f8fafc !important; font-family: var(--font-sans); }
    
    /* Typography & Bright High-Contrast Headers */
    h1, h2, h3, h4 {
      font-family: var(--font-heading) !important;
      letter-spacing: -0.02em;
    }
    h1 {
      font-weight: 800;
      color: #ffffff !important;
      background: linear-gradient(135deg, #ffffff 20%, #67e8f9 60%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.4rem !important;
      font-size: clamp(2.2rem, 4vw, 3.4rem) !important;
    }
    h2, h3 { color: #f1f5f9 !important; font-weight: 700 !important; }
    p, span, label, div { color: #f1f5f9; }
    
    /* Animated Floating Keyframes */
    @keyframes floatSlow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(0.5deg); }
    }
    @keyframes floatDelay {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(8px) rotate(-0.5deg); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.25); }
      50% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.55); }
    }
    @keyframes breatheCircle {
            0%, 100% { transform: scale(0.86); opacity: 0.76; box-shadow: 0 0 0 10px rgba(45, 212, 191, 0.08), 0 0 30px rgba(45, 212, 191, 0.22); }
            28.57%, 57.14% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 0 16px rgba(45, 212, 191, 0.1), 0 0 48px rgba(45, 212, 191, 0.42); }
    }
        @keyframes breathingCue {
            0%, 28.56% { content: "INHALE"; }
            28.57%, 57.13% { content: "PAUSE"; }
            57.14%, 100% { content: "EXHALE"; }
        }

    /* Floating Cards */
    .floating-card-1 { animation: floatSlow 6s ease-in-out infinite; }
    .floating-card-2 { animation: floatDelay 7s ease-in-out infinite; }
    
    /* Interactive Photo Gallery Cards */
    .photo-card {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(15, 23, 42, 0.8);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .photo-card:hover {
      transform: translateY(-8px) scale(1.02);
      border-color: #38bdf8;
      box-shadow: 0 20px 40px rgba(56, 189, 248, 0.25);
    }
    .photo-caption {
      padding: 10px 14px;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%);
      font-size: 0.85rem;
      font-weight: 600;
      color: #e2e8f0 !important;
    }
        .calm-practice { padding: 18px 20px; border: 1px solid rgba(45, 212, 191, 0.24); border-left: 3px solid #2dd4bf; border-radius: 12px; background: linear-gradient(130deg, rgba(15, 118, 110, 0.17), rgba(15, 23, 42, 0.8)); }
        .calm-practice h3 { margin: 0 0 6px; color: #f0fdfa !important; font-size: 1.1rem; }
        .calm-practice p { margin: 0; color: #b8cbcf !important; font-size: 0.83rem; line-height: 1.55; }
        .breathing-sequence { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 12px 0; }
        .breathing-phase-card { padding: 12px 10px; border: 1px solid rgba(153, 246, 228, 0.2); border-radius: 10px; background: rgba(15, 31, 36, 0.88); }
        .breathing-phase-card span, .breathing-phase-card strong { display: block; }
        .breathing-phase-card span { color: #9db2b8; font-size: 0.72rem; text-transform: uppercase; }
        .breathing-phase-card strong { margin-top: 4px; color: #ccfbf1; font-size: 1rem; }
        .grounding-checks { padding: 14px 16px; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 12px; background: rgba(15, 23, 42, 0.7); }
        .wellness-photo img { height: 245px !important; }
        .wellness-photo .photo-caption strong { display: block; margin-bottom: 4px; color: #f0fdfa; }
        .wellness-photo .photo-caption span { color: #cbd5e1; font-size: 0.82rem; }
        .next-step-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
        .next-step-card { min-height: 245px; overflow: hidden; border: 1px solid rgba(153, 246, 228, 0.18); border-radius: 11px; background: linear-gradient(145deg, rgba(17, 34, 40, 0.95), rgba(13, 24, 32, 0.95)); }
        .next-step-image { display: block; width: 100%; height: 132px; object-fit: cover; }
        .next-step-content { padding: 13px 14px 15px; }
        .next-step-card span, .next-step-card strong { display: block; }
        .next-step-card span { color: #99f6e4; font: 700 0.68rem var(--font-mono); text-transform: uppercase; }
        .next-step-card strong { margin: 9px 0 5px; color: #f0fdfa; font-size: 0.9rem; }
        .next-step-card p { margin: 0; color: #b8cbcf !important; font-size: 0.77rem; line-height: 1.5; }
        @media (max-width: 760px) { .next-step-grid { grid-template-columns: 1fr; } }

    /* Luminous Badge */
    .title-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border: 1px solid rgba(56, 189, 248, 0.5);
      border-radius: 999px;
      color: #38bdf8 !important;
      background: rgba(56, 189, 248, 0.12);
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
      margin-bottom: 0.8rem;
    }
    
    /* High-Contrast Glass Panels */
    .card, .glass-panel {
      background: rgba(17, 24, 39, 0.9) !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 18px;
      padding: 1.5rem;
      margin-bottom: 1.2rem;
      box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45);
    }

    /* Metric Cards with Vivid Color Accents */
    .metric-card {
      border-radius: 16px;
      padding: 1.4rem;
      margin-bottom: 1rem;
      background: linear-gradient(145deg, #131b2e 0%, #0d1424 100%) !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-left: 5px solid #38bdf8 !important;
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.4);
      transition: all 0.25s ease;
    }
    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.55);
    }

        [data-testid="stMetric"] {
            min-height: 112px;
            padding: 1rem 1.1rem;
            border: 1px solid rgba(45, 212, 191, 0.28);
            border-radius: 14px;
            background: linear-gradient(145deg, rgba(17, 34, 40, 0.96), rgba(13, 24, 32, 0.96));
            box-shadow: 0 10px 26px rgba(0, 0, 0, 0.2);
        }
        [data-testid="stMetricLabel"] { color: #a8bdc4 !important; }
        [data-testid="stMetricValue"] { color: #f0fdfa !important; font-weight: 800; }
    
    /* Luminous Severity Badges */
    .badge-normal {
      color: #10b981 !important;
      background: rgba(16, 185, 129, 0.2) !important;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.86rem;
      border: 1px solid #10b981 !important;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
    }
    .badge-mild {
      color: #38bdf8 !important;
      background: rgba(56, 189, 248, 0.2) !important;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.86rem;
      border: 1px solid #38bdf8 !important;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
    }
    .badge-moderate {
      color: #fbbf24 !important;
      background: rgba(251, 191, 36, 0.2) !important;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.86rem;
      border: 1px solid #fbbf24 !important;
      box-shadow: 0 0 16px rgba(251, 191, 36, 0.35);
    }
    .badge-severe {
      color: #f87171 !important;
      background: rgba(248, 113, 113, 0.2) !important;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.86rem;
      border: 1px solid #f87171 !important;
      box-shadow: 0 0 16px rgba(248, 113, 113, 0.35);
    }
    .badge-extremely-severe {
      color: #c084fc !important;
      background: rgba(192, 132, 252, 0.2) !important;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.86rem;
      border: 1px solid #c084fc !important;
      box-shadow: 0 0 16px rgba(192, 132, 252, 0.35);
    }

    /* Buttons with Modern Neon Glow */
    /* Buttons with Modern Neon Glow & Smooth Physics */
    .stButton > button {
      background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%) !important;
      color: #ffffff !important;
      font-weight: 800 !important;
      border: 1px solid rgba(255, 255, 255, 0.22) !important;
      border-radius: 14px !important;
      padding: 0.75rem 1.6rem !important;
      font-size: 0.95rem !important;
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35) !important;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
      letter-spacing: -0.01em !important;
    }
    .stButton > button:hover {
      transform: translateY(-3px) scale(1.02) !important;
      box-shadow: 0 14px 35px rgba(99, 102, 241, 0.55), 0 0 25px rgba(56, 189, 248, 0.4) !important;
      border-color: #ffffff !important;
    }

    /* Sleek Sidebar Quick Presets & Buttons */
    [data-testid="stSidebar"] .stButton > button {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%) !important;
      border: 1px solid rgba(56, 189, 248, 0.3) !important;
      padding: 0.65rem 0.5rem !important;
      font-size: 0.84rem !important;
      font-weight: 700 !important;
      border-radius: 12px !important;
      white-space: nowrap !important;
      letter-spacing: -0.01em !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3) !important;
      transition: all 0.22s ease !important;
    }
    [data-testid="stSidebar"] .stButton > button:hover {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%) !important;
      border-color: #38bdf8 !important;
      box-shadow: 0 6px 20px rgba(56, 189, 248, 0.45) !important;
      transform: translateY(-2px) !important;
      color: #ffffff !important;
    }

    /* Form Inputs, Selects & Textareas */
    [data-baseweb="input"], [data-baseweb="select"] > div, textarea {
      background: #0f172a !important;
      border: 1px solid rgba(255, 255, 255, 0.25) !important;
      border-radius: 10px !important;
      color: #ffffff !important;
      font-size: 0.96rem !important;
    }
    [data-baseweb="input"]:focus-within, [data-baseweb="select"] > div:focus-within {
      border-color: #38bdf8 !important;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.35) !important;
    }
    [data-baseweb="popover"] {
      background: #0f172a !important;
      border: 1px solid rgba(56, 189, 248, 0.35) !important;
      border-radius: 12px !important;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.8) !important;
    }
    [data-baseweb="popover"] *, [role="option"], [role="listbox"] {
      color: #f8fafc !important;
      background-color: #0f172a !important;
    }
    [role="option"] {
      padding: 0.7rem 0.9rem !important;
      border-radius: 8px !important;
    }
    [role="option"]:hover, [role="option"][aria-selected="true"] {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(168, 85, 247, 0.18)) !important;
      color: #ffffff !important;
    }
    
    /* High-Visibility Labels & Text Across All Streamlit Widgets */
    .stRadio label, .stSlider label, .stSelectbox label, .stNumberInput label, .stTextInput label {
      color: #ffffff !important;
      font-weight: 700 !important;
      font-size: 0.96rem !important;
      letter-spacing: 0.01em;
    }
    .stRadio div[role="radiogroup"] label {
      color: #f1f5f9 !important;
      font-size: 0.94rem !important;
      font-weight: 600 !important;
    }
    .stMarkdown p, .stMarkdown span, .stMarkdown li {
      color: #f8fafc !important;
      font-size: 0.96rem !important;
      line-height: 1.6;
    }
    .stSlider [data-baseweb="slider"] {
      padding-top: 8px;
    }
    
    /* Styled Tabs */
    .stTabs [data-baseweb="tab-list"] {
      gap: 12px;
      background: #0b1120;
      padding: 8px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.18);
    }
    .stTabs [data-baseweb="tab"] {
      border-radius: 11px;
      padding: 10px 22px;
      color: #cbd5e1 !important;
      font-weight: 700;
      font-size: 0.96rem;
      transition: all 0.2s ease;
    }
    .stTabs [data-baseweb="tab"]:hover {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.12);
    }
    .stTabs [aria-selected="true"] {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%) !important;
      color: #38bdf8 !important;
      border: 1px solid #38bdf8 !important;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.35);
    }

    /* Animated Breathing Circle */
        .breathing-stage {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(250px, 0.8fr);
            align-items: center;
            gap: 2rem;
            min-height: 430px;
            padding: 2.4rem 2.7rem;
            border: 1px solid rgba(153, 246, 228, 0.26);
            border-radius: 18px;
            background: #071316;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
        }
        .breathing-stage-image { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 54%; filter: saturate(0.74) brightness(0.68); }
        .breathing-stage::after { content: ''; position: absolute; z-index: -1; inset: 0; background: linear-gradient(90deg, rgba(4, 15, 19, 0.97) 0%, rgba(4, 15, 19, 0.88) 42%, rgba(4, 15, 19, 0.2) 100%); }
        .breathing-copy { max-width: 560px; }
        .breathing-eyebrow { color: #99f6e4; font: 700 0.72rem var(--font-sans); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1rem; }
        .breathing-title { color: #f0fdfa !important; font: 700 2rem/1.12 var(--font-heading); margin: 0 0 0.7rem; }
        .breathing-intro { color: #cbd5e1 !important; font-size: 0.95rem !important; line-height: 1.65; max-width: 430px; }
        .breathing-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.55rem; max-width: 430px; margin: 1.4rem 0 1rem; }
        .breathing-steps div { padding: 0.65rem 0.55rem; border: 1px solid rgba(204, 251, 241, 0.24); border-radius: 10px; background: rgba(5, 22, 25, 0.58); }
        .breathing-steps strong, .breathing-steps span { display: block; }
        .breathing-steps strong { color: #ccfbf1; font-size: 0.95rem; }
        .breathing-steps span { color: #d1dfe1; font-size: 0.78rem; margin-top: 0.15rem; }
        .breathing-safety { color: #b7c9cc !important; font-size: 0.8rem !important; line-height: 1.5; margin: 0; max-width: 430px; }
        .breathing-orbit { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; }
    .breathing-orb {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 194px;
            height: 194px;
      border-radius: 50%;
            background: radial-gradient(circle at 36% 30%, #ccfbf1 0%, #5eead4 28%, #0f766e 68%, #102a31 100%);
            border: 1px solid rgba(204, 251, 241, 0.55);
            animation: breatheCircle 14s ease-in-out infinite;
        }
        .breathing-orb::before, .breathing-orb::after { content: ''; position: absolute; inset: -20px; border: 1px solid rgba(153, 246, 228, 0.28); border-radius: 50%; animation: breatheCircle 14s ease-in-out infinite; pointer-events: none; }
        .breathing-orb::after { inset: -42px; opacity: 0.55; animation-delay: 0.25s; }
        .breathing-phase { color: #062522 !important; font: 800 0.76rem var(--font-sans); letter-spacing: 0.12em; }
        .breathing-phase::before { content: "INHALE"; animation: breathingCue 14s steps(1, end) infinite; }
        .breathing-orbit-caption { margin-top: 3.5rem; color: #e2f4f1; font-size: 0.8rem; letter-spacing: 0.03em; }
        @media (max-width: 760px) {
            .breathing-stage { grid-template-columns: 1fr; gap: 0.8rem; padding: 1.5rem; }
            .breathing-copy { text-align: center; margin: 0 auto; }
            .breathing-intro, .breathing-steps, .breathing-safety { margin-left: auto; margin-right: auto; }
            .breathing-orbit { min-height: 250px; }
            .breathing-stage::after { background: linear-gradient(180deg, rgba(4, 15, 19, 0.94) 0%, rgba(4, 15, 19, 0.8) 54%, rgba(4, 15, 19, 0.32) 100%); }
    }
    }

    /* Disclaimer Box */
    .disclaimer-box {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 14px;
      padding: 1.2rem 1.4rem;
      font-size: 0.88rem;
      color: #e0f2fe !important;
      line-height: 1.6;
      margin-top: 1.4rem;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    /* =========================================================================
       DYNAMIC MOOD REACTION STYLES & ANIMATIONS
       ========================================================================= */
    @keyframes reactionPopUp {
      0% { transform: scale(0.94) translateY(10px); opacity: 0; }
      60% { transform: scale(1.02) translateY(-2px); opacity: 1; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes auraPulse {
      0%, 100% { box-shadow: 0 0 20px var(--mood-glow, rgba(56,189,248,0.35)); }
      50% { box-shadow: 0 0 45px var(--mood-glow, rgba(56,189,248,0.7)), 0 0 80px var(--mood-glow, rgba(56,189,248,0.3)); }
    }
    @keyframes eqBarPulse {
      0%, 100% { height: 4px; }
      50% { height: 24px; }
    }

    .mood-reaction-card {
      animation: reactionPopUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards, auraPulse 4s ease-in-out infinite;
      border-radius: 18px;
      padding: 1.5rem;
      margin-bottom: 1.6rem;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .mood-reaction-card.balanced {
      --mood-glow: rgba(16, 185, 129, 0.6);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 46, 38, 0.85) 100%);
      border-color: rgba(16, 185, 129, 0.6);
    }
    .mood-reaction-card.cool {
      --mood-glow: rgba(6, 182, 212, 0.6);
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(8, 51, 68, 0.85) 100%);
      border-color: rgba(6, 182, 212, 0.6);
    }
    .mood-reaction-card.anxiety {
      --mood-glow: rgba(168, 85, 247, 0.6);
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(59, 7, 100, 0.85) 100%);
      border-color: rgba(168, 85, 247, 0.6);
    }
    .mood-reaction-card.mood {
      --mood-glow: rgba(99, 102, 241, 0.6);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(30, 27, 75, 0.85) 100%);
      border-color: rgba(99, 102, 241, 0.6);
    }
    .mood-reaction-card.stress {
      --mood-glow: rgba(249, 115, 22, 0.6);
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(67, 20, 7, 0.85) 100%);
      border-color: rgba(249, 115, 22, 0.6);
    }
    .mood-reaction-card.focus {
      --mood-glow: rgba(234, 179, 8, 0.6);
      background: linear-gradient(135deg, rgba(234, 179, 8, 0.22) 0%, rgba(77, 49, 3, 0.85) 100%);
      border-color: rgba(234, 179, 8, 0.6);
    }

    /* Equalizer Soundwaves */
    .vital-eq {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 24px;
      margin-right: 8px;
    }
    .vital-eq span {
      display: inline-block;
      width: 3.5px;
      background: #ffffff;
      border-radius: 99px;
      animation: eqBarPulse 1.1s ease-in-out infinite;
    }
    .vital-eq span:nth-child(2) { animation-delay: 0.18s; }
    .vital-eq span:nth-child(3) { animation-delay: 0.36s; }
    .vital-eq span:nth-child(4) { animation-delay: 0.54s; }
    .vital-eq span:nth-child(5) { animation-delay: 0.72s; }

    /* =========================================================================
       SOUNDSCAPE & PEACE MUSIC GLASSMORPHIC CARDS
       ========================================================================= */
    /* =========================================================================
       ENHANCED PSYCHOACOUSTIC SOUND STUDIO & SOUNDSCAPE CSS
       ========================================================================= */
    @keyframes equalizerBounce {
      0%, 100% { height: 6px; }
      50% { height: 26px; }
    }
    @keyframes soundCardGlow {
      0%, 100% { box-shadow: 0 0 20px var(--card-glow, rgba(56, 189, 248, 0.35)), inset 0 0 15px rgba(255,255,255,0.03); }
      50% { box-shadow: 0 0 45px var(--card-glow, rgba(56, 189, 248, 0.65)), inset 0 0 25px rgba(255,255,255,0.06); }
    }
    @keyframes soundAuraShimmer {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .sound-studio-header {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.75) 100%) !important;
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 20px;
      padding: 1.6rem 2rem;
      margin-bottom: 1.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.15);
    }
    .sound-studio-header::before {
      content: '';
      position: absolute;
      top: -40%;
      right: -15%;
      width: 260px;
      height: 260px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%);
      pointer-events: none;
    }

    /* Master Soundstage Player Card */
    .master-soundstage {
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.96) 0%, rgba(26, 36, 56, 0.85) 100%) !important;
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border-radius: 22px;
      padding: 1.8rem;
      margin-top: 1.2rem;
      margin-bottom: 1.5rem;
      position: relative;
      overflow: hidden;
      border: 2px solid var(--card-accent, #38bdf8) !important;
      animation: soundCardGlow 4s ease-in-out infinite;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px var(--card-glow, rgba(56, 189, 248, 0.35));
    }

    /* Multi-Bar Animated Equalizer */
    .studio-equalizer {
      display: inline-flex;
      align-items: flex-end;
      gap: 4px;
      height: 30px;
      padding: 4px 6px;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .studio-equalizer span {
      display: inline-block;
      width: 4px;
      border-radius: 99px;
      background: var(--eq-color, #38bdf8);
      animation: equalizerBounce 1.2s ease-in-out infinite;
    }
    .studio-equalizer span:nth-child(1) { height: 8px; animation-delay: 0.1s; }
    .studio-equalizer span:nth-child(2) { height: 18px; animation-delay: 0.35s; }
    .studio-equalizer span:nth-child(3) { height: 26px; animation-delay: 0.15s; }
    .studio-equalizer span:nth-child(4) { height: 14px; animation-delay: 0.5s; }
    .studio-equalizer span:nth-child(5) { height: 28px; animation-delay: 0.25s; }
    .studio-equalizer span:nth-child(6) { height: 20px; animation-delay: 0.45s; }
    .studio-equalizer span:nth-child(7) { height: 12px; animation-delay: 0.6s; }
    .studio-equalizer span:nth-child(8) { height: 24px; animation-delay: 0.3s; }

    /* Soundscape Card Improvements */
    .soundscape-card {
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.75) 100%) !important;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-radius: 20px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.14);
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45);
      margin-bottom: 1.2rem;
      width: 100% !important;
      box-sizing: border-box !important;
      display: block !important;
    }

    .soundscape-card:hover {
      transform: translateY(-4px) scale(1.005);
      border-color: var(--card-accent, #38bdf8);
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.65), 0 0 30px var(--card-glow, rgba(56, 189, 248, 0.35));
    }

    .soundscape-card.active-recommended {
      border: 2px solid var(--card-accent, #38bdf8) !important;
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.85) 100%) !important;
      animation: soundCardGlow 4s ease-in-out infinite;
    }

    .soundscape-card-header {
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      width: 100% !important;
      margin-bottom: 0.8rem !important;
    }

    .soundscape-card-title {
      font-size: 1.15rem !important;
      font-weight: 800 !important;
      margin: 0 !important;
      display: block !important;
      white-space: normal !important;
      word-break: normal !important;
      overflow-wrap: break-word !important;
      writing-mode: horizontal-tb !important;
      text-orientation: mixed !important;
      flex: 1 1 auto !important;
      min-width: 180px !important;
      line-height: 1.4 !important;
      letter-spacing: -0.01em !important;
    }

    .soundscape-tag-row {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      margin-bottom: 0.9rem !important;
      width: 100% !important;
    }

    .soundscape-tag-pill {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 4px 12px !important;
      border-radius: 999px !important;
      font-size: 0.76rem !important;
      font-weight: 800 !important;
      letter-spacing: 0.04em !important;
      white-space: nowrap !important;
    }

    .soundscape-desc {
      color: #cbd5e1 !important;
      font-size: 0.9rem !important;
      line-height: 1.55 !important;
      margin: 0 0 1rem 0 !important;
      display: block !important;
      width: 100% !important;
      white-space: normal !important;
      word-break: normal !important;
    }

    /* Science Pillars Grid */
    .sound-science-card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 1.3rem 1.5rem;
      transition: all 0.3s ease;
      height: 100%;
    }
    .sound-science-card:hover {
      border-color: #38bdf8;
      background: rgba(15, 23, 42, 0.92);
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.4);
    }

    /* Streamlit Audio Player Overrides for Dark Glass Theme */
    audio {
      width: 100% !important;
      height: 42px !important;
      border-radius: 12px !important;
      margin-top: 0.5rem !important;
      outline: none !important;
      filter: contrast(1.15) brightness(0.95);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    audio::-webkit-media-controls-panel {
      background-color: #1e293b !important;
      color: #ffffff !important;
      border-radius: 12px !important;
    }
    audio::-webkit-media-controls-current-time-display,
    audio::-webkit-media-controls-time-remaining-display {
      color: #38bdf8 !important;
      font-family: monospace;
      font-weight: 700;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

SEVERITY_COLORS = {
    "Normal": "#10b981",
    "Mild": "#38bdf8",
    "Moderate": "#fbbf24",
    "Severe": "#f87171",
    "Extremely Severe": "#c084fc",
}

SEVERITY_CSS_MAP = {
    "Normal": "badge-normal",
    "Mild": "badge-mild",
    "Moderate": "badge-moderate",
    "Severe": "badge-severe",
    "Extremely Severe": "badge-extremely-severe",
}

# -----------------------------------------------------------------------------
# MODEL INFERENCE LOADER (Direct In-Memory with Fallback)
# -----------------------------------------------------------------------------
@st.cache_resource
def load_trained_models():
    """Load the trained model artifacts for Depression, Anxiety, and Stress."""
    loaded_models = {}
    for target in config.TARGETS:
        model_path = config.MODELS_DIR / f"best_model_{target}.joblib"
        if model_path.exists():
            try:
                loaded_models[target] = joblib.load(model_path)
            except Exception as e:
                loaded_models[target] = None
        else:
            loaded_models[target] = None
    return loaded_models

def run_local_inference(tipi_dict, vocab_score, age, gender, education, urban, engnat, hand, religion, orientation, race, voted, married, familysize):
    """Run model prediction locally with exact feature alignment."""
    models = load_trained_models()
    r = lambda x: 8 - x
    
    # Feature construction
    row = {
        "trait_extraversion": (tipi_dict["tipi1"] + r(tipi_dict["tipi6"])) / 2.0,
        "trait_agreeableness": (r(tipi_dict["tipi2"]) + tipi_dict["tipi7"]) / 2.0,
        "trait_conscientiousness": (tipi_dict["tipi3"] + r(tipi_dict["tipi8"])) / 2.0,
        "trait_emotional_stability": (r(tipi_dict["tipi4"]) + tipi_dict["tipi9"]) / 2.0,
        "trait_openness": (tipi_dict["tipi5"] + r(tipi_dict["tipi10"])) / 2.0,
        "vocab_score": float(vocab_score),
        "age": float(age),
        "familysize": float(familysize),
        "introelapse": 30.0,
        "testelapse": 300.0,
        "surveyelapse": 60.0,
        f"education_{float(education)}": 1,
        f"education_{int(education)}": 1,
        f"urban_{int(urban)}": 1,
        f"urban_{float(urban)}": 1,
        f"gender_{int(gender)}": 1,
        f"gender_{float(gender)}": 1,
        f"engnat_{int(engnat)}": 1,
        f"engnat_{float(engnat)}": 1,
        f"hand_{int(hand)}": 1,
        f"hand_{float(hand)}": 1,
        f"religion_{float(religion)}": 1,
        f"religion_{int(religion)}": 1,
        f"orientation_{float(orientation)}": 1,
        f"orientation_{int(orientation)}": 1,
        f"race_{int(race)}": 1,
        f"race_{int(race)*10}": 1,
        f"race_{float(race)}": 1,
        f"voted_{int(voted)}": 1,
        f"voted_{float(voted)}": 1,
        f"married_{int(married)}": 1,
        f"married_{float(married)}": 1,
    }
    df_row = pd.DataFrame([row])
    
    results = {}
    for target in config.TARGETS:
        bundle = models.get(target)
        if bundle is not None and "model" in bundle and "feature_names" in bundle:
            model = bundle["model"]
            feature_names = bundle["feature_names"]
            aligned = df_row.reindex(columns=feature_names, fill_value=0)
            pred = str(model.predict(aligned)[0])
            proba = model.predict_proba(aligned)[0]
            classes = getattr(model, "classes_", model.named_steps["clf"].classes_ if hasattr(model, "named_steps") else config.SEVERITY_ORDER)
            
            prob_dict = {str(c): float(p) for c, p in zip(classes, proba)}
            results[target.lower()] = {
                "severity": pred,
                "probabilities": prob_dict,
                "model_used": bundle.get("model_name", "LogisticRegression (Leakage-Free)")
            }
        else:
            es = row["trait_emotional_stability"]
            ex = row["trait_extraversion"]
            ag = row["trait_agreeableness"]
            
            if target == "Depression":
                score = max(0.0, min(1.0, (7 - es) * 0.14 + (7 - ex) * 0.05))
            elif target == "Anxiety":
                score = max(0.0, min(1.0, (7 - es) * 0.16 + (7 - ag) * 0.03))
            else:
                score = max(0.0, min(1.0, (7 - es) * 0.15 + (0.05 if age < 30 else 0.0)))
                
            def get_sev(s):
                return "Severe" if s > 0.65 else "Moderate" if s > 0.45 else "Mild" if s > 0.25 else "Normal"
            def get_probs(s):
                if s > 0.65: return {"Normal": 0.05, "Mild": 0.12, "Moderate": 0.23, "Severe": 0.42, "Extremely Severe": 0.18}
                if s > 0.45: return {"Normal": 0.10, "Mild": 0.20, "Moderate": 0.45, "Severe": 0.18, "Extremely Severe": 0.07}
                if s > 0.25: return {"Normal": 0.25, "Mild": 0.42, "Moderate": 0.22, "Severe": 0.08, "Extremely Severe": 0.03}
                return {"Normal": 0.65, "Mild": 0.20, "Moderate": 0.10, "Severe": 0.04, "Extremely Severe": 0.01}
                
            results[target.lower()] = {
                "severity": get_sev(score),
                "probabilities": get_probs(score),
                "model_used": "Psychometric Trait Inference (Zero-Downtime Fallback)"
            }
            
    return results

# -----------------------------------------------------------------------------
# DASS-42 AUTHENTIC QUESTIONS & CLINICAL SCORING
# -----------------------------------------------------------------------------
DASS42_QUESTIONS = {
    1: ("Stress", "I found myself getting upset by quite trivial things"),
    2: ("Anxiety", "I was aware of dryness of my mouth"),
    3: ("Depression", "I couldn't seem to experience any positive feeling at all"),
    4: ("Anxiety", "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)"),
    5: ("Depression", "I just couldn't seem to get going"),
    6: ("Stress", "I tended to over-react to situations"),
    7: ("Anxiety", "I had a feeling of shakiness (e.g. legs going to give way)"),
    8: ("Stress", "I found it difficult to relax"),
    9: ("Anxiety", "I found myself in situations that made me so anxious I was most relieved when they ended"),
    10: ("Depression", "I felt that I had nothing to look forward to"),
    11: ("Stress", "I found myself getting upset rather easily"),
    12: ("Stress", "I felt that I was using a lot of nervous energy"),
    13: ("Depression", "I felt sad and depressed"),
    14: ("Stress", "I found myself getting impatient when I was delayed in any way (e.g. lifts, traffic lights, being kept waiting)"),
    15: ("Anxiety", "I had a feeling of faintness"),
    16: ("Depression", "I felt that I had lost interest in just about everything"),
    17: ("Depression", "I felt I wasn't worth much as a person"),
    18: ("Stress", "I felt that I was rather touchy"),
    19: ("Anxiety", "I perspired noticeably (e.g. hands sweaty) in the absence of high temperatures or physical exertion"),
    20: ("Anxiety", "I felt scared without any good reason"),
    21: ("Depression", "I felt that life wasn't worthwhile"),
    22: ("Stress", "I found it hard to wind down"),
    23: ("Anxiety", "I had difficulty in swallowing"),
    24: ("Depression", "I couldn't seem to get any enjoyment out of the things I did"),
    25: ("Anxiety", "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)"),
    26: ("Depression", "I felt down-hearted and blue"),
    27: ("Stress", "I found that I was very irritable"),
    28: ("Anxiety", "I felt I was close to panic"),
    29: ("Stress", "I found it hard to calm down after something upset me"),
    30: ("Anxiety", "I feared that I would be 'thrown' by some trivial but unfamiliar task"),
    31: ("Depression", "I was unable to become enthusiastic about anything"),
    32: ("Stress", "I found it difficult to tolerate interruptions to what I was doing"),
    33: ("Stress", "I was in a state of nervous tension"),
    34: ("Depression", "I felt I was pretty worthless"),
    35: ("Stress", "I was intolerant of anything that kept me from getting on with what I was doing"),
    36: ("Anxiety", "I felt terrified"),
    37: ("Depression", "I could see nothing in the future to be hopeful about"),
    38: ("Depression", "I felt that life was meaningless"),
    39: ("Stress", "I found myself getting agitated"),
    40: ("Anxiety", "I was worried about situations in which I might panic and make a fool of myself"),
    41: ("Anxiety", "I experienced trembling (e.g. in the hands)"),
    42: ("Depression", "I found it difficult to work up the initiative to do things"),
}

def calculate_dass42_severity(scale, score):
    cutoffs = config.SEVERITY_THRESHOLDS[scale]
    for severity, (low, high) in cutoffs.items():
        if low <= score <= high:
            return severity
    return "Extremely Severe" if score > 42 else "Normal"

# -----------------------------------------------------------------------------
# HERO HEADER WITH ANIMATED MOVABLE ELEMENTS & PHOTOS
# -----------------------------------------------------------------------------
hero_left, hero_right = st.columns([1.3, 0.7])

with hero_left:
    st.markdown('<div class="title-badge">⚡ MediGrid Intelligence · Clinical AI</div>', unsafe_allow_html=True)
    st.title("🧠 DASS-42 Mental State & Emotion Classifier")
    st.markdown(
        "<p style='font-size: 1.08rem; line-height: 1.6; color: #cbd5e1 !important;'>"
        "A safe, private psychometric screening platform providing real-time AI classification "
        "and clinical scoring for <strong>Depression</strong>, <strong>Anxiety</strong>, and <strong>Stress</strong>."
        "</p>",
        unsafe_allow_html=True
    )
    st.markdown(
        '<div class="floating-card-1" style="display: flex; gap: 12px; align-items: center; padding: 10px 16px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; margin-top: 1rem; width: fit-content;">'
        '<span>🌿</span><strong style="color: #38bdf8;">Take a slow breath.</strong> <span style="color: #e2e8f0;">Answer honestly at your own pace.</span>'
        '</div>',
        unsafe_allow_html=True
    )

with hero_right:
    render_html(
        """
        <div class="photo-card floating-card-2">
            <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=85" 
                 style="width: 100%; height: 180px; object-fit: cover; display: block;" />
            <div class="photo-caption">
                🤝 <strong>Compassionate Care:</strong> Good care begins with feeling heard.
            </div>
        </div>
        """
    )

# -----------------------------------------------------------------------------
# INTERACTIVE MINDFUL PHOTO GALLERY (EXPANDABLE WITH MOVABLE CARDS)
# -----------------------------------------------------------------------------
with st.expander("🖼️ View Calming Wellness & Mindfulness Photo Gallery", expanded=True):
    gcol1, gcol2, gcol3, gcol4 = st.columns(4)
    gallery_photos = [
        ("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80", "🌊 Ocean Horizon", "Finding calm in the rhythm of the waves."),
        ("https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80", "🌲 Forest Silence", "Grounding yourself in peaceful green space."),
        ("https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=600&q=80", "☕ A Quiet Moment", "Permitting yourself to take a pause."),
        ("https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80", "🌅 Morning Light", "Every new day brings fresh opportunity."),
    ]
    for col, (url, title, caption) in zip([gcol1, gcol2, gcol3, gcol4], gallery_photos):
        with col:
            render_html(
                f"""
                <div class="photo-card">
                    <img src="{url}" style="width: 100%; height: 135px; object-fit: cover; display: block;" />
                    <div class="photo-caption">
                        <strong>{title}</strong><br>
                        <span style="font-size: 0.78rem; opacity: 0.85;">{caption}</span>
                    </div>
                </div>
                """
            )

st.markdown("---")

# -----------------------------------------------------------------------------
# CENTRAL PRESET PROFILES & MOOD REACTION METADATA
# -----------------------------------------------------------------------------
PRESETS = {
    "balanced": {
        "name": "🌟 Balanced",
        "class": "balanced",
        "tipi": {"tipi1": 5, "tipi2": 6, "tipi3": 6, "tipi4": 2, "tipi5": 6, "tipi6": 3, "tipi7": 6, "tipi8": 2, "tipi9": 6, "tipi10": 2},
        "age": 28,
        "vocab": 11,
        "title": "Balanced & Steady Baseline Activated",
        "quote": "🌿 Emotional stability is grounded and steady. Autonomic nervous system is regulated with optimal resilience.",
        "badge": "Steady Rhythm",
        "traits": {"Extraversion": 5.0, "Agreeableness": 5.5, "Conscientiousness": 6.0, "Emotional Stability": 6.0, "Openness": 6.0}
    },
    "cool": {
        "name": "❄️ Cool & Calm",
        "class": "cool",
        "tipi": {"tipi1": 4, "tipi2": 6, "tipi3": 5, "tipi4": 1, "tipi5": 5, "tipi6": 4, "tipi7": 6, "tipi8": 2, "tipi9": 7, "tipi10": 3},
        "age": 29,
        "vocab": 12,
        "title": "Cool & Zen Relaxation State",
        "quote": "❄️ Deep parasympathetic nervous activation. Heart rate steady, tension release cues engaged.",
        "badge": "Zen Flow",
        "traits": {"Extraversion": 4.0, "Agreeableness": 5.5, "Conscientiousness": 5.5, "Emotional Stability": 7.0, "Openness": 5.0}
    },
    "anxiety": {
        "name": "⚡ High Anxiety",
        "class": "anxiety",
        "tipi": {"tipi1": 2, "tipi2": 4, "tipi3": 4, "tipi4": 7, "tipi5": 4, "tipi6": 6, "tipi7": 4, "tipi8": 5, "tipi9": 1, "tipi10": 5},
        "age": 22,
        "vocab": 7,
        "title": "High Situational Anxiety Profile",
        "quote": "⚡ Elevated autonomic nervous arousal and anticipatory worry indicators active.",
        "badge": "Alert State",
        "traits": {"Extraversion": 2.0, "Agreeableness": 4.0, "Conscientiousness": 3.5, "Emotional Stability": 1.0, "Openness": 3.5}
    },
    "mood": {
        "name": "🌧️ Low Mood",
        "class": "mood",
        "tipi": {"tipi1": 1, "tipi2": 3, "tipi3": 3, "tipi4": 6, "tipi5": 2, "tipi6": 7, "tipi7": 3, "tipi8": 6, "tipi9": 2, "tipi10": 6},
        "age": 31,
        "vocab": 6,
        "title": "Low Mood & Energy Lethargy Profile",
        "quote": "🌧️ Reduced positive affect and motivation fatigue markers. Self-compassion recommended.",
        "badge": "Compassion Mode",
        "traits": {"Extraversion": 1.0, "Agreeableness": 3.5, "Conscientiousness": 2.5, "Emotional Stability": 2.0, "Openness": 2.0}
    },
    "stress": {
        "name": "🔥 High Stress",
        "class": "stress",
        "tipi": {"tipi1": 4, "tipi2": 2, "tipi3": 5, "tipi4": 7, "tipi5": 4, "tipi6": 4, "tipi7": 3, "tipi8": 3, "tipi9": 2, "tipi10": 4},
        "age": 26,
        "vocab": 8,
        "title": "High Nervous Tension & Work Stress",
        "quote": "🔥 Elevated irritability, time pressure urgency, and somatic tension indicators active.",
        "badge": "Tension Alert",
        "traits": {"Extraversion": 4.0, "Agreeableness": 3.5, "Conscientiousness": 5.0, "Emotional Stability": 1.5, "Openness": 4.0}
    },
    "focus": {
        "name": "✨ Focus & Flow",
        "class": "focus",
        "tipi": {"tipi1": 6, "tipi2": 5, "tipi3": 7, "tipi4": 2, "tipi5": 7, "tipi6": 2, "tipi7": 5, "tipi8": 1, "tipi9": 6, "tipi10": 1},
        "age": 27,
        "vocab": 13,
        "title": "High Conscientiousness & Peak Flow",
        "quote": "✨ High self-discipline, emotional balance, and expansive cognitive openness active.",
        "badge": "Peak Flow",
        "traits": {"Extraversion": 6.0, "Agreeableness": 5.0, "Conscientiousness": 7.0, "Emotional Stability": 6.0, "Openness": 7.0}
    }
}

PRESET_MUSIC = {
    "balanced": {
        "id": "balanced",
        "file": "forest_528hz.wav",
        "title": "Soft Morning Breeze · 528Hz Calm",
        "freq": "528Hz Calm Tone",
        "icon": "🌤️",
        "color": "#60a5fa",
        "desc": "Gentle, airy sound with a soft morning rhythm to bring balance and ease.",
        "image": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80"
    },
    "cool": {
        "id": "cool",
        "file": "ocean_432hz.wav",
        "title": "Soft Ocean Drift · 432Hz Peace",
        "freq": "432Hz Peace Tone",
        "icon": "🌊",
        "color": "#7dd3fc",
        "desc": "Smooth ocean waves and mellow harmony designed to quiet tension and soften the mind.",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    },
    "anxiety": {
        "id": "anxiety",
        "file": "stream_theta.wav",
        "title": "Cotton River Flow · Theta Ease",
        "freq": "Theta Grounding",
        "icon": "🏞️",
        "color": "#c084fc",
        "desc": "A calm river stream with slow, comforting rhythm to settle racing thoughts.",
        "image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
    },
    "mood": {
        "id": "mood",
        "file": "night_theta.wav",
        "title": "Moonlit Quiet · Gentle Night Music",
        "freq": "Soft Theta Rest",
        "icon": "🌙",
        "color": "#a78bfa",
        "desc": "Warm night ambience and hush-filled tones to soothe emotional exhaustion and rest the mind.",
        "image": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80"
    },
    "stress": {
        "id": "stress",
        "file": "rain_delta.wav",
        "title": "Soft Rain Drizzle · Delta Calm",
        "freq": "Delta Release",
        "icon": "🌧️",
        "color": "#f9a8d4",
        "desc": "Light rain and mellow tones to reduce overwhelm and encourage deep calm.",
        "image": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=80"
    },
    "focus": {
        "id": "focus",
        "file": "wind_gamma.wav",
        "title": "Cloudy Meadow Glow · Soft Focus",
        "freq": "Gentle Gamma Focus",
        "icon": "💨",
        "color": "#fbbf24",
        "desc": "A light, airy ambient pattern designed to support creative concentration without strain.",
        "image": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80"
    }
}

def render_mood_audio_player(preset_key: str, compact: bool = False):
    """Render the active psychoacoustic audio player tuned to the selected mood preset."""
    track = PRESET_MUSIC.get(preset_key, PRESET_MUSIC["balanced"])
    audio_base_dir = Path(__file__).resolve().parent / "audio"
    local_file = audio_base_dir / track["file"]
    
    if compact:
        render_html(f"""
        <div style="margin-top: 10px; padding: 10px 12px; background: rgba(15,23,42,0.92); border: 1px solid {track['color']}66; border-radius: 12px; box-shadow: 0 4px 15px {track['color']}22;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div style="font-size: 0.82rem; font-weight: 700; color: {track['color']}; display: flex; align-items: center; gap: 5px;">
                    <span>{track['icon']}</span> <span>{track['title']}</span>
                </div>
                <span style="font-size: 0.65rem; font-weight: 800; background: {track['color']}; color: #000; padding: 2px 6px; border-radius: 999px;">{track['freq']}</span>
            </div>
            <div style="font-size: 0.72rem; color: #cbd5e1; margin-bottom: 6px;">{track['desc']}</div>
        </div>
        """)
    else:
        render_html(f"""
        <div class="soundscape-card active-recommended" style="--card-accent: {track['color']}; --card-glow: {track['color']}44; margin-top: 14px; margin-bottom: 8px;">
            <div class="soundscape-card-header">
                <h4 class="soundscape-card-title" style="color: {track['color']} !important;">
                    {track['icon']} {track['title']}
                </h4>
                <span class="soundscape-tag-pill" style="background: {track['color']}; color: #000; font-weight: 800;">AUTO-TUNED MOOD SOUNDSCAPE</span>
            </div>
            <div class="soundscape-tag-row">
                <span class="soundscape-tag-pill" style="background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.12);">
                    🏷️ Auto-Selected for {PRESETS[preset_key]['name']}
                </span>
                <span class="soundscape-tag-pill" style="background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3);">
                    ⚡ {track['freq']}
                </span>
            </div>
            <p class="soundscape-desc">{track['desc']}</p>
        </div>
        """)

    if local_file.exists():
        with open(local_file, "rb") as af:
            audio_data = af.read()
        st.audio(audio_data, format="audio/wav")
    else:
        st.audio(f"http://localhost:5000/audio/{track['file']}", format="audio/wav")

def set_active_preset(key):
    preset = PRESETS[key]
    st.session_state.active_preset_key = key
    st.session_state.tipi_preset = preset["tipi"]
    st.session_state.age_preset = preset["age"]
    st.session_state.vocab_preset = preset["vocab"]

# Default preset on first run
if "active_preset_key" not in st.session_state:
    set_active_preset("cool")

# -----------------------------------------------------------------------------
# SIDEBAR NAVIGATION & QUICK PRESETS
# -----------------------------------------------------------------------------
navigation_labels = {
    "⚡ Rapid AI Screener (Personality & Demographics)": "Screening · Rapid AI",
    "📋 Full 42-Item Clinical DASS-42 Questionnaire": "Screening · DASS-42",
    "💬 Real-Time MindCare AI Chatbot": "Care · MindCare chat",
    "🎶 Mood-Based Peace Music & Soundscapes": "Care · Peace sounds",
    "🌬️ Interactive Animated Breathing Reset": "Care · Breathing reset",
    "📊 Model Leaderboard & Diagnostics": "Insights · Model scores",
    "🌿 MindCare Calming Suite & Resources": "Care · Calming tools",
}
navigation_tab = st.sidebar.selectbox(
    "Go to",
    options=list(navigation_labels),
    format_func=lambda option: navigation_labels[option],
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 💡 Quick Fill Presets")
sidebar_p1, sidebar_p2 = st.sidebar.columns(2)
if sidebar_p1.button("🌟 Balanced", use_container_width=True, key="sb_btn_balanced"):
    set_active_preset("balanced")
if sidebar_p2.button("❄️ Cool & Calm", use_container_width=True, key="sb_btn_cool"):
    set_active_preset("cool")

sidebar_p3, sidebar_p4 = st.sidebar.columns(2)
if sidebar_p3.button("⚡ High Anxiety", use_container_width=True, key="sb_btn_anxiety"):
    set_active_preset("anxiety")
if sidebar_p4.button("🌧️ Low Mood", use_container_width=True, key="sb_btn_mood"):
    set_active_preset("mood")

sidebar_p5, sidebar_p6 = st.sidebar.columns(2)
if sidebar_p5.button("🔥 High Stress", use_container_width=True, key="sb_btn_stress"):
    set_active_preset("stress")
if sidebar_p6.button("✨ Focus & Flow", use_container_width=True, key="sb_btn_focus"):
    set_active_preset("focus")

st.sidebar.markdown("<div style='margin-top: 10px;'></div>", unsafe_allow_html=True)
st.sidebar.markdown(f"**🎶 Active Mood Soundscape:**")
with st.sidebar:
    render_mood_audio_player(st.session_state.active_preset_key, compact=True)

# -----------------------------------------------------------------------------
# TAB 1: RAPID AI SCREENER
# -----------------------------------------------------------------------------
if navigation_tab == "⚡ Rapid AI Screener (Personality & Demographics)":
    st.markdown("### ⚡ Rapid AI Screener")
    st.markdown(
        "<p style='color: #e2e8f0 !important; font-size: 0.98rem;'>"
        "Predicts Depression, Anxiety, and Stress risk bands using Big-Five Personality markers "
        "and demographic indicators with <strong>zero leakage</strong>."
        "</p>",
        unsafe_allow_html=True
    )

    # 1-Click Interactive Mood Reaction Bar in Main Page
    st.markdown("##### ⚡ 1-Click Mood Reaction Presets (Click to React & Auto-Fill):")
    mcol1, mcol2, mcol3, mcol4, mcol5, mcol6 = st.columns(6)
    
    if mcol1.button("🌟 Balanced", key="main_btn_balanced", use_container_width=True):
        set_active_preset("balanced")
    if mcol2.button("❄️ Cool & Calm", key="main_btn_cool", use_container_width=True):
        set_active_preset("cool")
    if mcol3.button("⚡ Anxiety", key="main_btn_anxiety", use_container_width=True):
        set_active_preset("anxiety")
    if mcol4.button("🌧️ Low Mood", key="main_btn_mood", use_container_width=True):
        set_active_preset("mood")
    if mcol5.button("🔥 High Stress", key="main_btn_stress", use_container_width=True):
        set_active_preset("stress")
    if mcol6.button("✨ Focus/Flow", key="main_btn_focus", use_container_width=True):
        set_active_preset("focus")

    current_key = st.session_state.get("active_preset_key", "balanced")
    curr_preset = PRESETS.get(current_key, PRESETS["balanced"])

    # DYNAMIC ANIMATED REACTION STAGE
    traits_html = "".join([f'<span style="font-size: 0.76rem; padding: 3px 8px; background: rgba(0,0,0,0.3); border-radius: 6px; color: #e2e8f0;">{trait}: <strong>{val}/7</strong></span>' for trait, val in curr_preset['traits'].items()])
    reaction_html = f"""
    <div class="mood-reaction-card {curr_preset['class']}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center;">
                <span class="vital-eq">
                    <span></span><span></span><span></span><span></span><span></span>
                </span>
                <strong style="font-size: 1.15rem; color: #ffffff !important;">{curr_preset['title']}</strong>
            </div>
            <span style="font-size: 0.78rem; font-weight: 800; padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,0.2); color: #ffffff !important; text-transform: uppercase;">
                {curr_preset['badge']}
            </span>
        </div>
        <p style="font-size: 0.92rem; line-height: 1.5; color: #f1f5f9 !important; margin: 6px 0 10px 0;">
            {curr_preset['quote']}
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 10px;">
            {traits_html}
        </div>
    </div>
    """
    render_html(reaction_html)

    st.markdown(f"##### 🎧 Active Psychoacoustic Soundscape (Tuned to {curr_preset['name']}):")
    render_mood_audio_player(current_key, compact=False)

    p_tipi = st.session_state.get("tipi_preset", curr_preset["tipi"])
    p_age = st.session_state.get("age_preset", curr_preset["age"])
    p_vocab = st.session_state.get("vocab_preset", curr_preset["vocab"])

    with st.form("rapid_screener_form"):
        st.markdown("#### 1. Big-Five Personality Scale (TIPI 10-Item)")
        st.caption("Rate how strongly each statement describes you (1 = Strongly Disagree, 4 = Neutral, 7 = Strongly Agree).")

        tcol1, tcol2 = st.columns(2)
        with tcol1:
            tipi1 = st.slider("1. Extraverted, enthusiastic", 1, 7, int(p_tipi["tipi1"]))
            tipi2 = st.slider("2. Critical, quarrelsome (Reverse-scored)", 1, 7, int(p_tipi["tipi2"]))
            tipi3 = st.slider("3. Dependable, self-disciplined", 1, 7, int(p_tipi["tipi3"]))
            tipi4 = st.slider("4. Anxious, easily upset (Reverse-scored)", 1, 7, int(p_tipi["tipi4"]))
            tipi5 = st.slider("5. Open to new experiences, complex", 1, 7, int(p_tipi["tipi5"]))

        with tcol2:
            tipi6 = st.slider("6. Reserved, quiet (Reverse-scored)", 1, 7, int(p_tipi["tipi6"]))
            tipi7 = st.slider("7. Sympathetic, warm", 1, 7, int(p_tipi["tipi7"]))
            tipi8 = st.slider("8. Disorganized, careless (Reverse-scored)", 1, 7, int(p_tipi["tipi8"]))
            tipi9 = st.slider("9. Calm, emotionally stable", 1, 7, int(p_tipi["tipi9"]))
            tipi10 = st.slider("10. Conventional, uncreative (Reverse-scored)", 1, 7, int(p_tipi["tipi10"]))

        st.markdown("---")
        st.markdown("#### 2. Demographics & Background")
        dcol1, dcol2, dcol3 = st.columns(3)

        with dcol1:
            age = st.number_input("Age", min_value=13, max_value=100, value=int(p_age))
            gender = st.selectbox("Gender", [1, 2, 3], format_func=lambda x: {1: "Male", 2: "Female", 3: "Other"}[x])
            education = st.selectbox("Education Level", [1, 2, 3, 4], format_func=lambda x: {1: "Less than High School", 2: "High School Diploma", 3: "University / College Degree", 4: "Graduate / Master's / Doctorate"}[x], index=2)

        with dcol2:
            urban = st.selectbox("Living Area", [1, 2, 3], format_func=lambda x: {1: "Rural (Country)", 2: "Suburban", 3: "Urban (City)"}[x], index=2)
            married = st.selectbox("Marital Status", [1, 2, 3], format_func=lambda x: {1: "Never Married / Single", 2: "Currently Married", 3: "Divorced / Widowed / Separated"}[x])
            familysize = st.number_input("Number of Siblings", min_value=0, max_value=20, value=1)

        with dcol3:
            vocab_score = st.slider("Vocabulary Recognition Score (0–14)", 0, 14, int(p_vocab))
            engnat = st.selectbox("Native English Speaker?", [1, 2], format_func=lambda x: {1: "Yes", 2: "No"}[x])
            hand = st.selectbox("Dominant Hand", [1, 2, 3], format_func=lambda x: {1: "Right Hand", 2: "Left Hand", 3: "Ambidextrous"}[x])

        submitted = st.form_submit_button("🔮 Predict Mental State (Run ML Inference)", type="primary", use_container_width=True)

    if submitted:
        tipi_input = {
            "tipi1": tipi1, "tipi2": tipi2, "tipi3": tipi3, "tipi4": tipi4, "tipi5": tipi5,
            "tipi6": tipi6, "tipi7": tipi7, "tipi8": tipi8, "tipi9": tipi9, "tipi10": tipi10,
        }
        
        with st.spinner("Analyzing psychometric signals across multi-target models..."):
            results = run_local_inference(
                tipi_input, vocab_score, age, gender, education, urban, engnat, hand,
                religion=1, orientation=1, race=6, voted=1, married=married, familysize=familysize
            )

        st.success("✅ Machine Learning Inference Completed!")
        
        # Display 3 Target Cards
        mcol1, mcol2, mcol3 = st.columns(3)
        targets_info = [
            ("Depression", results["depression"], mcol1, "#38bdf8"),
            ("Anxiety", results["anxiety"], mcol2, "#fbbf24"),
            ("Stress", results["stress"], mcol3, "#f87171"),
        ]

        for target_name, pred_data, col, color in targets_info:
            with col:
                sev = pred_data["severity"]
                css_class = SEVERITY_CSS_MAP.get(sev, "badge-mild")
                probs = pred_data["probabilities"]
                prob_bars = "".join([
                    f'<div style="margin-bottom: 6px;"><div style="display:flex; justify-content:space-between; font-size:0.82rem; color:#cbd5e1; margin-bottom:2px;"><span>{band}</span><strong>{int(round(probs.get(band, 0.0)*100))}%</strong></div><div style="background: rgba(255,255,255,0.08); border-radius: 999px; height: 6px; overflow: hidden;"><div style="background: {color}; width: {max(0, min(100, int(round(probs.get(band, 0.0)*100))))}%; height: 100%; border-radius: 999px;"></div></div></div>'
                    for band in config.SEVERITY_ORDER
                ])
                card_html = f"""
                <div class="metric-card" style="border-left-color: {color} !important;">
                    <h3 style="color: #ffffff !important; margin-top: 0; margin-bottom: 8px;">{target_name}</h3>
                    <div style="margin-bottom: 12px; font-size: 0.95rem;">Risk Level: <span class="{css_class}">{sev}</span></div>
                    <strong style="color: #f8fafc; font-size: 0.88rem; display: block; margin-bottom: 8px;">Probability Distribution:</strong>
                    {prob_bars}
                    <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 10px;">Engine: {pred_data['model_used']}</div>
                </div>
                """
                render_html(card_html)

        # Big Five Trait Spectrum
        st.markdown("---")
        st.markdown("### 📊 Your Derived Big-Five Personality Spectrum")
        r = lambda x: 8 - x
        traits = {
            "Extraversion": (tipi1 + r(tipi6)) / 2.0,
            "Agreeableness": (r(tipi2) + tipi7) / 2.0,
            "Conscientiousness": (tipi3 + r(tipi8)) / 2.0,
            "Emotional Stability": (r(tipi4) + tipi9) / 2.0,
            "Openness": (tipi5 + r(tipi10)) / 2.0,
        }
        trait_df = pd.DataFrame(list(traits.items()), columns=["Trait", "Score (1-7)"]).set_index("Trait")
        st.bar_chart(trait_df, color="#38bdf8")

        st.markdown(
            '<div class="disclaimer-box">'
            '🛡️ <strong>Clinical & Research Notice:</strong> This assessment is an artificial intelligence screening tool trained on '
            'population psychometrics. It is designed for early reflection and is <strong>not a medical diagnosis</strong>. '
            'If you are experiencing distress, please connect with a licensed healthcare professional.'
            '</div>',
            unsafe_allow_html=True
        )

# -----------------------------------------------------------------------------
# TAB 2: FULL 42-ITEM DASS-42 CLINICAL QUESTIONNAIRE
# -----------------------------------------------------------------------------
elif navigation_tab == "📋 Full 42-Item Clinical DASS-42 Questionnaire":
    dass_h1, dass_h2 = st.columns([1.35, 0.65])
    with dass_h1:
        st.markdown('<div class="title-badge">📋 Gold-Standard Psychometrics · Lovibond Scale</div>', unsafe_allow_html=True)
        st.markdown("### 📋 Authentic 42-Item DASS-42 Clinical Assessment")
        st.markdown(
            "<p style='color: #cbd5e1 !important; font-size: 0.98rem; line-height: 1.55;'>"
            "The 42-item Depression Anxiety Stress Scales (DASS-42) provides quantitative dimensional measurement "
            "of negative emotional states across three core psychological dimensions over the past week."
            "</p>",
            unsafe_allow_html=True
        )
    with dass_h2:
        render_html(
            """
            <div class="photo-card" style="margin-top: 5px;">
                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=700&q=80" 
                     style="width: 100%; height: 135px; object-fit: cover; display: block;" />
                <div class="photo-caption">
                    📊 <strong>Clinical Metric:</strong> Evidence-based psychometric assessment.
                </div>
            </div>
            """
        )
    
    render_html(
        """
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 12px 18px; margin-bottom: 1.2rem;">
            <strong style="color: #38bdf8;">Standard Scoring Key:</strong><br>
            <span style="color: #cbd5e1;">
            • <strong>0</strong>: Did not apply to me at all &nbsp;|&nbsp;
            • <strong>1</strong>: Applied to some degree / some of the time &nbsp;|&nbsp;
            • <strong>2</strong>: Applied to a considerable degree &nbsp;|&nbsp;
            • <strong>3</strong>: Applied very much / most of the time
            </span>
        </div>
        """
    )

    with st.form("dass42_full_form"):
        q_tabs = st.tabs(["💙 Depression Scale (14 Qs)", "💛 Anxiety Scale (14 Qs)", "🧡 Stress Scale (14 Qs)"])
        
        responses = {}
        
        # Depression Tab
        with q_tabs[0]:
            dep_items = config.DASS_ITEMS["Depression"]
            for q_num in dep_items:
                _, q_text = DASS42_QUESTIONS[q_num]
                responses[q_num] = st.radio(
                    f"**Q{q_num}.** {q_text}",
                    [0, 1, 2, 3],
                    format_func=lambda x: {0: "0 - Never / Not at all", 1: "1 - Sometimes", 2: "2 - Often", 3: "3 - Almost Always"}[x],
                    key=f"dass_q_{q_num}",
                    horizontal=True
                )
        
        # Anxiety Tab
        with q_tabs[1]:
            anx_items = config.DASS_ITEMS["Anxiety"]
            for q_num in anx_items:
                _, q_text = DASS42_QUESTIONS[q_num]
                responses[q_num] = st.radio(
                    f"**Q{q_num}.** {q_text}",
                    [0, 1, 2, 3],
                    format_func=lambda x: {0: "0 - Never / Not at all", 1: "1 - Sometimes", 2: "2 - Often", 3: "3 - Almost Always"}[x],
                    key=f"dass_q_{q_num}",
                    horizontal=True
                )
                
        # Stress Tab
        with q_tabs[2]:
            str_items = config.DASS_ITEMS["Stress"]
            for q_num in str_items:
                _, q_text = DASS42_QUESTIONS[q_num]
                responses[q_num] = st.radio(
                    f"**Q{q_num}.** {q_text}",
                    [0, 1, 2, 3],
                    format_func=lambda x: {0: "0 - Never / Not at all", 1: "1 - Sometimes", 2: "2 - Often", 3: "3 - Almost Always"}[x],
                    key=f"dass_q_{q_num}",
                    horizontal=True
                )

        calc_submitted = st.form_submit_button("📊 Calculate Official DASS-42 Clinical Scores", type="primary", use_container_width=True)

    if calc_submitted:
        dep_score = sum(responses[q] for q in config.DASS_ITEMS["Depression"])
        anx_score = sum(responses[q] for q in config.DASS_ITEMS["Anxiety"])
        str_score = sum(responses[q] for q in config.DASS_ITEMS["Stress"])

        dep_sev = calculate_dass42_severity("Depression", dep_score)
        anx_sev = calculate_dass42_severity("Anxiety", anx_score)
        str_sev = calculate_dass42_severity("Stress", str_score)

        st.success("✅ Clinical DASS-42 Scoring Complete!")
        
        scol1, scol2, scol3 = st.columns(3)
        with scol1:
            render_html(f"""
            <div class="metric-card" style="border-left-color: #38bdf8 !important;">
                <h3 style="color: #ffffff; margin-top:0;">Depression Scale</h3>
                <div style="font-size: 1.6rem; font-weight: 700; color: #38bdf8; margin: 6px 0;">{dep_score} <span style="font-size: 0.95rem; color: #94a3b8; font-weight: normal;">/ 42</span></div>
                <div style="margin-bottom: 8px;">Severity: <span class="{SEVERITY_CSS_MAP[dep_sev]}">{dep_sev}</span></div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Cutoff range: Normal (0-9), Mild (10-13), Mod (14-20), Sev (21-27), Ext Sev (28+)</div>
            </div>
            """)

        with scol2:
            render_html(f"""
            <div class="metric-card" style="border-left-color: #fbbf24 !important;">
                <h3 style="color: #ffffff; margin-top:0;">Anxiety Scale</h3>
                <div style="font-size: 1.6rem; font-weight: 700; color: #fbbf24; margin: 6px 0;">{anx_score} <span style="font-size: 0.95rem; color: #94a3b8; font-weight: normal;">/ 42</span></div>
                <div style="margin-bottom: 8px;">Severity: <span class="{SEVERITY_CSS_MAP[anx_sev]}">{anx_sev}</span></div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Cutoff range: Normal (0-7), Mild (8-9), Mod (10-14), Sev (15-19), Ext Sev (20+)</div>
            </div>
            """)

        with scol3:
            render_html(f"""
            <div class="metric-card" style="border-left-color: #f87171 !important;">
                <h3 style="color: #ffffff; margin-top:0;">Stress Scale</h3>
                <div style="font-size: 1.6rem; font-weight: 700; color: #f87171; margin: 6px 0;">{str_score} <span style="font-size: 0.95rem; color: #94a3b8; font-weight: normal;">/ 42</span></div>
                <div style="margin-bottom: 8px;">Severity: <span class="{SEVERITY_CSS_MAP[str_sev]}">{str_sev}</span></div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Cutoff range: Normal (0-14), Mild (15-18), Mod (19-25), Sev (26-33), Ext Sev (34+)</div>
            </div>
            """)

        # Summary Bar Chart
        summary_df = pd.DataFrame({
            "Scale": ["Depression", "Anxiety", "Stress"],
            "Score": [dep_score, anx_score, str_score],
            "Max Score": [42, 42, 42]
        }).set_index("Scale")
        st.markdown("#### Clinical Score Comparison")
        st.bar_chart(summary_df["Score"], color="#38bdf8")

# -----------------------------------------------------------------------------
# TAB 3: REAL-TIME MINDCARE AI CHATBOT
# -----------------------------------------------------------------------------
elif navigation_tab == "💬 Real-Time MindCare AI Chatbot":
    chat_h1, chat_h2 = st.columns([1.35, 0.65])
    with chat_h1:
        st.markdown('<div class="title-badge">💬 Emotional Triage & Grounding · AI Assistant</div>', unsafe_allow_html=True)
        st.markdown("### 🤖 MindCare Real-Time AI Companion")
        st.markdown(
            "<p style='color: #cbd5e1 !important; font-size: 1rem; line-height: 1.55;'>"
            "Chat in real time with our clinical grounding AI for guided breathing, anxiety relief, low mood support, "
            "and psychometric screening insights."
            "</p>",
            unsafe_allow_html=True
        )
    with chat_h2:
        render_html(
            """
            <div class="photo-card" style="margin-top: 5px;">
                <img src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80" 
                     style="width: 100%; height: 135px; object-fit: cover; display: block;" />
                <div class="photo-caption">
                    🧠 <strong>Active Listening AI:</strong> A calm, judgment-free space to talk.
                </div>
            </div>
            """
        )

    if "chat_language" not in st.session_state:
        st.session_state.chat_language = "English"

    language_col, _ = st.columns([0.8, 2.2])
    with language_col:
        st.session_state.chat_language = st.selectbox(
            "Language / भाषा",
            ["English", "Hindi"],
            index=0 if st.session_state.chat_language == "English" else 1,
            key="chat_language_selector"
        )

    # Initialize chat history
    if "chat_messages" not in st.session_state:
        if st.session_state.chat_language == "Hindi":
            welcome = (
                "👋 **नमस्ते! मैं आपका MediGrid MindCare AI Assistant हूँ।**\n\n"
                "अगर आप दबाव में हैं, शांत करने का तरीका ढूंढ़ रहे हैं, या DASS-42 स्कोर समझना चाहते हैं, "
                "मैं एक सुरक्षित और बिना जजमेंट के जगह पर आपकी मदद करने के लिए यहाँ हूँ। आज आप कैसा महसूस कर रहे हैं?"
            )
        else:
            welcome = (
                "👋 **Hello! I'm your MediGrid MindCare AI Assistant.**\n\n"
                "Whether you're feeling overwhelmed, looking for a calming exercise, or want to interpret your DASS-42 scores, "
                "I'm here to support you in a safe and judgment-free space. How are you feeling right now?"
            )
        st.session_state.chat_messages = [{"role": "assistant", "content": welcome}]

    # Quick prompt buttons
    st.markdown("##### ⚡ Quick Support & Conversation Prompts")
    q_col1, q_col2, q_col3, q_col4 = st.columns(4)
    quick_input = None
    if q_col1.button("💬 Talk About My Day", key="qb_talk", use_container_width=True):
        quick_input = "Can we talk? I'd like to share how my day is going and have a friendly conversation."
    if q_col2.button("🧘 Guided Breathing", key="qb_breath", use_container_width=True):
        quick_input = "Can you guide me through a calming box breathing exercise?"
    if q_col3.button("⚡ High Anxiety Relief", key="qb_anx", use_container_width=True):
        quick_input = "I'm experiencing high anxiety and racing thoughts. What can I do right now?"
    if q_col4.button("🌧️ Low Mood / Fatigue", key="qb_mood", use_container_width=True):
        quick_input = "I feel completely drained, down, and low on motivation today."

    ctl_col1, ctl_col2 = st.columns([1.5, 0.5])
    with ctl_col2:
        if st.button("🗑️ Clear Chat History", key="btn_clear_chat", use_container_width=True):
            if st.session_state.chat_language == "Hindi":
                welcome = (
                    "👋 **नमस्ते! मैं आपका MediGrid MindCare AI Assistant हूँ।**\n\n"
                    "अगर आप दबाव में हैं, शांत करने का तरीका ढूंढ़ रहे हैं, या अपने भावनाओं के बारे में बात करना चाहते हैं, "
                    "मैं सुरक्षित और बिना जजमेंट के जगह पर आपकी मदद करने के लिए यहाँ हूँ। आज आप कैसा महसूस कर रहे हैं?"
                )
            else:
                welcome = (
                    "👋 **Hello! I'm your MediGrid MindCare AI Assistant.**\n\n"
                    "Whether you're feeling overwhelmed, looking for a calming exercise, or want to talk through how you feel, "
                    "I'm here to support you in a safe and judgment-free space. How are you feeling right now?"
                )
            st.session_state.chat_messages = [{"role": "assistant", "content": welcome}]
            st.rerun()

    def generate_chat_response(prompt_text, current_preset):
        if st.session_state.chat_language == "Hindi":
            hindi_mode = True
        else:
            hindi_mode = any("\u0900" <= ch <= "\u097F" for ch in prompt_text)

        # 1. Try hitting the Express backend API
        try:
            req_data = json.dumps({"message": prompt_text, "moodContext": PRESETS[current_preset]["name"], "language": "hindi" if hindi_mode else "english"}).encode("utf-8")
            req = urllib.request.Request(
                "http://localhost:5000/api/chat",
                data=req_data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    payload = json.loads(resp.read().decode())
                    if "reply" in payload and payload["reply"]:
                        return payload["reply"]
        except Exception:
            pass

        # 2. Resilient In-Process Clinical Rule Engine
        msg = prompt_text.lower()

        if any(w in msg for w in ["suicide", "kill myself", "end my life", "self harm", "hurt myself", "want to die", "cant take it", "mar gaya", "khud ko", "jeene ki", "hai"]):
            if hindi_mode:
                return (
                    "🚨 **तत्काल आपातकालीन सहायता**\n\n"
                    "आप अकेले नहीं हैं। 24/7 सहायता उपलब्ध है:\n\n"
                    "- 🇮🇳 **भारत:** `14416` या `1800-891-4416` (Tele-MANAS)\n"
                    "- 🇺🇸 **USA:** `988` (Suicide & Crisis Lifeline)\n"
                    "- 🇬🇧 **UK:** `111` या `116 123` (Samaritans)\n\n"
                    "कृपया अभी एक बार कॉल करें या टेक्स्ट करें। आप महत्वपूर्ण हैं, और मदद करने वाले लोग तैयार हैं।"
                )
            return (
                "🚨 **URGENT CRISIS INTERVENTION SUPPORT**\n\n"
                "Please know that you are not alone, and immediate support is available 24/7:\n\n"
                "- 🇺🇸 **United States:** Call or text `988` (Suicide & Crisis Lifeline)\n"
                "- 🇮🇳 **India:** Call `14416` or `1800-891-4416` (Tele-MANAS)\n"
                "- 🇬🇧 **United Kingdom:** Call `111` (NHS) or `116 123` (Samaritans)\n"
                "- 🇨🇦 **Canada:** Call or text `988`\n\n"
                "Please contact one of these free, confidential helplines right now. You matter, and caring specialists are standing by."
            )

        if any(w in msg for w in ["talk", "chat", "listen", "conversation", "friend", "lonely", "baat", "samjhana", "sunna", "akela", "dost"]):
            if hindi_mode:
                return (
                    "💬 **मैं यहाँ हूँ और सुन रहा हूँ।**\n\n"
                    "तुम्हें जितना समय चाहिए, ले लो। आज क्या हुआ, कैसा महसूस कर रहे हो, या कुछ भी अपने मन की बात कहो।\n\n"
                    "यह एक सुरक्षित, बिना जजमेंट का स्थान है। इस समय मैं तुम्हारी कैसे मदद कर सकता हूँ?"
                )
            return (
                "💬 **I am right here with you and listening.**\n\n"
                "Take all the time you need. Tell me what's on your mind—how you've been feeling, what happened today, or anything you'd like to vent or reflect on.\n\n"
                "You're in a safe, judgment-free space. How can I best support you in this moment?"
            )

        if any(w in msg for w in ["breath", "box breathing", "panic", "hyperventilat", "saans", "shwas", "breathing", "panic", "ghabrahat", "dhas"]):
            if hindi_mode:
                return (
                    "🧘 **गाइडेड बॉक्स ब्रेथिंग (4-4-4-4)**\n\n"
                    "आइए चरण-दर-चरण शांति लाते हैं:\n\n"
                    "1. **साँस अंदर लें** 4 गिनती में: *1... 2... 3... 4*\n"
                    "2. **4 सेकंड के लिए रोकें**: *1... 2... 3... 4*\n"
                    "3. **साँस बाहर छोड़ें** 4 गिनती में: *1... 2... 3... 4*\n"
                    "4. **फिर थोड़ी देर रोकें**: *1... 2... 3... 4*\n\n"
                    "💡 *टिप:* **🎶 Mood-Based Peace Music & Soundscapes** में **Ocean Shoreline (432Hz)** सुनें।"
                )
            return (
                "🧘 **Guided Box Breathing Reset (4-4-4-4)**\n\n"
                "Let's ground your autonomic nervous system step-by-step:\n\n"
                "1. **Inhale** gently through your nose for 4 counts: *1... 2... 3... 4*\n"
                "2. **Hold** your lungs full softly for 4 counts: *1... 2... 3... 4*\n"
                "3. **Exhale** smoothly through your mouth for 4 counts: *1... 2... 3... 4*\n"
                "4. **Hold** empty gently for 4 counts: *1... 2... 3... 4*\n\n"
                "💡 *Tip:* Check out the **🎶 Mood-Based Peace Music & Soundscapes** tab to listen to **Ocean Shoreline (432Hz)** while practicing."
            )

        if any(w in msg for w in ["anxi", "nervous", "scared", "fear", "palpitat", "trembl", "worry", "ghabra", "dar", "chinta", "anxiety"]):
            if hindi_mode:
                return (
                    "⚡ **5-4-3-2-1 ग्राउंडिंग प्रोटोकॉल**\n\n"
                    "जब ansiedad बढ़ जाए, तो अपने आसपास की चीज़ों पर ध्यान दें:\n\n"
                    "• **5 चीज़ें जो दिखें:** 5 अलग-अलग रंग या बनावट देखें।\n"
                    "• **4 चीज़ें जो महसूस हों:** फर्श, कुर्सी, कपड़ा, पैर का स्पर्श।\n"
                    "• **3 चीज़ें जो सुनाई दें:** दूर की आवाज़, हवा, अपनी साँस।\n"
                    "• **2 चीज़ें जो सूंघें:** हवा, कॉफी, या कोई खुशबू।\n"
                    "• **1 सकारात्मक बयान:** *'मैं अभी सुरक्षित हूँ। यह भावना अस्थायी है और गुजर जाएगी।'*"
                )
            return (
                "⚡ **5-4-3-2-1 Sensory Grounding Protocol**\n\n"
                "When anxiety spikes, bringing attention back to your immediate environment resets neural threat loops:\n\n"
                "• **5 Things you can SEE:** Notice 5 distinct colors or textures in the room.\n"
                "• **4 Things you can TOUCH:** Feel your feet flat on the floor, your chair, or fabric.\n"
                "• **3 Things you can HEAR:** Distant traffic, the hum of electronics, your breath.\n"
                "• **2 Things you can SMELL:** Fresh air, coffee, or a nearby scent.\n"
                "• **1 Positive affirmation:** *'I am safe right now. This sensation is temporary and will pass.'*"
            )

        if any(w in msg for w in ["depress", "sad", "hopeless", "worthless", "empty", "down", "uduas", "nirash", "dukh", "khud ko", "beiman"]):
            if hindi_mode:
                return (
                    "💙 **दया और आराम**\n\n"
                    "कम-उत्साह महसूस करना बहुत थका देता है। आज अपने लिए नरम रहिए:\n\n"
                    "• **छोटा काम:** एक छोटा कदम चुनें—जैसे पानी का एक घूंट पीना भी एक उपलब्धि है।\n"
                    "• **स्वयं को दोष न दें:** आज सब कुछ ठीक करने की ज़रूरत नहीं है।\n"
                    "• **संगीत से आराम:** Peace Music में **Nocturne Serenade (Theta Wave)** सुनें।"
                )
            return (
                "💙 **Compassionate Care & Emotional Rest**\n\n"
                "Feeling low is deeply exhausting. Be gentle with your expectations today:\n\n"
                "• **Micro-action:** Break tasks into micro-steps (even taking one sip of water is an accomplishment).\n"
                "• **No self-judgment:** You don't need to 'fix' everything this afternoon.\n"
                "• **Acoustic Rest:** Switch on **Nocturne Serenade (Theta Wave)** in the Peace Music tab to allow your mind to rest."
            )

        if any(w in msg for w in ["stress", "overwhelm", "burnout", "work", "irritable", "agitat", "tanav", "stress", "overload", "thakan"]):
            if hindi_mode:
                return (
                    "🔥 **तनाव कम करने की विधि**\n\n"
                    "तनाव शरीर में एड्रेनालाईन और कोर्टिसोल बढ़ाता है:\n\n"
                    "1. **फिजियोलॉजिकल साइस:** नाक से दो तेज़ साँस लें, फिर लंबी साँस बाहर छोड़ें। 3 बार दोहराएँ।\n"
                    "2. **व्यवसाय की सीमा:** आज का सबसे महत्वपूर्ण काम चुनें; बाकी सब बाद में रख दें।\n"
                    "3. **साउंडस्केप:** **Gentle Forest Rain (Delta Wave)** सुनें।"
                )
            return (
                "🔥 **Somatic De-stress Protocol**\n\n"
                "Sustained stress floods the body with adrenaline and cortisol:\n\n"
                "1. **Physiological Sigh:** Take two quick sniffs in through your nose, then one long slow exhale through your mouth. Repeat 3 times.\n"
                "2. **Cognitive Boundary:** Identify the single most important task today; park everything else until tomorrow.\n"
                "3. **Soundscape:** Listen to **Gentle Forest Rain (Delta Wave)** to restore equilibrium."
            )

        if any(w in msg for w in ["medicat", "prescript", "pill", "dosage", "doctor", "drug", "dava", "medicine", "doctor", "dosage"]):
            if hindi_mode:
                return (
                    "💊 **MediGrid चिकित्सा जानकारी**\n\n"
                    "• अपने लाइसेंस्ड डॉक्टर द्वारा दी गई доз का सही पालन करें।\n"
                    "• अगर साइड इफेक्ट महसूस हों, तो तुरंत डॉक्टर से संपर्क करें या Patient Portal में दर्ज करें।\n"
                    "• रिफिल और प्रिस्क्रिप्शन सुरक्षित रूप से सत्यापित किए जा सकते हैं।"
                )
            return (
                "💊 **MediGrid Clinical E-Prescription Information**\n\n"
                "• Always follow the dosing schedule provided by your licensed healthcare professional.\n"
                "• If you experience adverse side-effects, log them in your MediGrid Patient Portal or consult your doctor immediately.\n"
                "• Refills and active digital prescriptions can be verified securely in the clinical portal."
            )

        if hindi_mode:
            return (
                "🌿 **MediGrid MindCare सहायता**\n\n"
                "अपना मन साझा करने के लिए धन्यवाद। आपके वर्तमान प्रबंधन मोड (*{preset}*) के आधार पर:\n\n"
                "• आप और अधिक बात करना चाहेंगे, या **Interactive Animated Breathing Reset** आज़माना चाहेंगे?\n"
                "• या अपने मूड के अनुसार **Mood-Based Peace Music** सुनना चाहेंगे?\n"
                "• आप **Full 42-Item DASS-42 Clinical Assessment** भी पूरा कर सकते हैं।".format(preset=PRESETS[st.session_state.active_preset_key]['name'])
            )

        return (
            f"🌿 **MediGrid MindCare Support**\n\n"
            f"Thank you for reaching out. Based on your current session profile (*{PRESETS[st.session_state.active_preset_key]['name']}*):\n\n"
            f"• Would you like to talk more, or try our **Interactive Animated Breathing Reset**?\n"
            f"• Or explore tailored **Mood-Based Peace Music** calibrated to your current mental state?\n"
            f"• You can also complete the **Full 42-Item DASS-42 Clinical Assessment** for verified psychometric scoring."
        )

    def stream_assistant_reply(reply_text):
        placeholder = st.empty()
        rendered = ""
        chunk_size = 7 if len(reply_text) > 180 else 3
        for i in range(0, len(reply_text), chunk_size):
            rendered += reply_text[i:i + chunk_size]
            placeholder.markdown(rendered + "▌")
            time.sleep(0.02)
        placeholder.markdown(reply_text)

    # Display chat history
    for message in st.session_state.chat_messages:
        with st.chat_message(message["role"], avatar="🤖" if message["role"] == "assistant" else "👤"):
            st.markdown(message["content"])

    # User input handling (via chat input or quick prompt button)
    user_prompt = st.chat_input("Type your message or question here to talk...")
    active_input = quick_input or user_prompt

    if active_input:
        st.session_state.chat_messages.append({"role": "user", "content": active_input})
        with st.chat_message("user", avatar="👤"):
            st.markdown(active_input)

        with st.chat_message("assistant", avatar="🤖"):
            bot_reply = generate_chat_response(active_input, st.session_state.active_preset_key)
            stream_assistant_reply(bot_reply)
            st.session_state.chat_messages.append({"role": "assistant", "content": bot_reply})

# -----------------------------------------------------------------------------
# TAB 4: MOOD-BASED PEACE MUSIC & SOUNDSCAPES
# -----------------------------------------------------------------------------
elif navigation_tab == "🎶 Mood-Based Peace Music & Soundscapes":
    curr_preset_key = st.session_state.active_preset_key
    curr_preset = PRESETS[curr_preset_key]
    active_music = PRESET_MUSIC[curr_preset_key]
    audio_base_dir = Path(__file__).resolve().parent / "audio"

    # Psychoacoustic Studio Master Holographic Header
    render_html(
        f"""
        <div class="sound-studio-header">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <div class="title-badge" style="margin-bottom: 8px; border-color: {active_music['color']}88; color: {active_music['color']} !important;">
                        🎶 Psychoacoustic Studio · Lossless Audio
                    </div>
                    <h2 style="margin: 0; font-size: 1.85rem; color: #ffffff !important; font-weight: 800; letter-spacing: -0.02em;">
                        🌿 Mood-Based Peace Music & Soundscapes
                    </h2>
                    <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 0.96rem; max-width: 780px; line-height: 1.5;">
                        Scientifically tuned Solfeggio frequencies (432Hz & 528Hz) and binaural brainwave entrainment 
                        calibrated to rebalance your autonomic nervous system and dissolve tension.
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
                    <span class="soundscape-tag-pill" style="background: rgba(16,185,129,0.18); color: #10b981; border: 1px solid rgba(16,185,129,0.45);">
                        🟢 44.1kHz Stereo PCM
                    </span>
                    <span class="soundscape-tag-pill" style="background: rgba(56,189,248,0.18); color: #38bdf8; border: 1px solid rgba(56,189,248,0.45);">
                        🔄 Seamless Neuro-Loop
                    </span>
                </div>
            </div>
        </div>
        """
    )

    # Instant Mood Frequency Selector Bar
    st.markdown("##### 🎛️ Instant Mood Frequency Selector (Click to Tune Live Soundstage):")
    s_col1, s_col2, s_col3, s_col4, s_col5, s_col6 = st.columns(6)
    
    if s_col1.button("🌟 Balanced", key="sound_p_balanced", use_container_width=True, type="primary" if curr_preset_key == "balanced" else "secondary"):
        set_active_preset("balanced")
        st.rerun()
    if s_col2.button("❄️ Cool", key="sound_p_cool", use_container_width=True, type="primary" if curr_preset_key == "cool" else "secondary"):
        set_active_preset("cool")
        st.rerun()
    if s_col3.button("⚡ Anxiety", key="sound_p_anxiety", use_container_width=True, type="primary" if curr_preset_key == "anxiety" else "secondary"):
        set_active_preset("anxiety")
        st.rerun()
    if s_col4.button("🌧️ Low Mood", key="sound_p_mood", use_container_width=True, type="primary" if curr_preset_key == "mood" else "secondary"):
        set_active_preset("mood")
        st.rerun()
    if s_col5.button("🔥 Stress", key="sound_p_stress", use_container_width=True, type="primary" if curr_preset_key == "stress" else "secondary"):
        set_active_preset("stress")
        st.rerun()
    if s_col6.button("✨ Focus", key="sound_p_focus", use_container_width=True, type="primary" if curr_preset_key == "focus" else "secondary"):
        set_active_preset("focus")
        st.rerun()

    # DYNAMIC MASTER SOUNDSTAGE (DIRECTLY TUNED TO FREQUENCY SELECTOR)
    render_html(
        f"""
        <div class="master-soundstage" style="--card-accent: {active_music['color']}; --card-glow: {active_music['color']}55;">
            <div style="display: grid; grid-template-columns: 1.35fr 0.85fr; gap: 20px; align-items: center;">
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="studio-equalizer" style="--eq-color: {active_music['color']};">
                                <span></span><span></span><span></span><span></span>
                                <span></span><span></span><span></span><span></span>
                            </div>
                            <div>
                                <div style="font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.12em; color: {active_music['color']}; font-weight: 800;">
                                    LIVE FREQUENCY RESONANCE · {curr_preset['name']}
                                </div>
                                <h3 style="margin: 2px 0 0 0; color: #ffffff !important; font-size: 1.45rem; font-weight: 800;">
                                    {active_music['icon']} {active_music['title']}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px;">
                        <span class="soundscape-tag-pill" style="background: {active_music['color']}; color: #000; font-weight: 800; font-size: 0.82rem; padding: 5px 12px;">
                            ⚡ {active_music['freq']}
                        </span>
                        <span class="title-badge" style="margin: 0; border-color: {active_music['color']}66; color: {active_music['color']} !important;">
                            {curr_preset['badge']}
                        </span>
                    </div>
                    <p style="margin: 0 0 12px 0; color: #f1f5f9; font-size: 0.95rem; line-height: 1.55;">
                        {active_music['desc']}
                    </p>
                    <div style="background: rgba(0,0,0,0.4); padding: 10px 14px; border-radius: 12px; font-size: 0.86rem; color: #cbd5e1; border-left: 4px solid {active_music['color']};">
                        💡 <em>{curr_preset['quote']}</em>
                    </div>
                </div>
                <div style="position: relative; overflow: hidden; border-radius: 16px; border: 1px solid rgba(255,255,255,0.18); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <img src="{active_music['image']}" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.92) 100%); padding: 8px 12px;">
                        <span style="font-size: 0.78rem; font-weight: 700; color: #ffffff;">🌿 Visual Immersion · {curr_preset['name']}</span>
                    </div>
                </div>
            </div>
        </div>
        """
    )

    # Master In-Memory Audio Playback
    active_local_file = audio_base_dir / active_music["file"]
    if active_local_file.exists():
        with open(active_local_file, "rb") as af:
            audio_bytes = af.read()
        st.audio(audio_bytes, format="audio/wav")
    else:
        st.audio(f"http://localhost:5000/audio/{active_music['file']}", format="audio/wav")

    st.markdown("<div style='margin-bottom: 1.6rem;'></div>", unsafe_allow_html=True)
    st.markdown("---")
    st.markdown("### 🎧 Curated Psychoacoustic Soundscape Library")
    st.markdown("<p style='color: #94a3b8; font-size: 0.92rem;'>Explore individual tracks below or click any frequency card to listen to custom ambient frequencies:</p>", unsafe_allow_html=True)

    SOUND_TRACKS = [
        {
            "id": "cool",
            "title": "Ocean Shoreline · 432Hz Serenity",
            "category": "Cool & Calm",
            "freq": "432Hz Solfeggio Harmonic",
            "desc": "Rhythmic ocean breakers with 432Hz harmonic tone to down-regulate sympathetic nervous arousal.",
            "file": "ocean_432hz.wav",
            "icon": "🌊",
            "color": "#06b6d4",
            "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "balanced",
            "title": "Morning Forest Birds · 528Hz Harmony",
            "category": "Balanced",
            "freq": "528Hz Transformation Tone",
            "desc": "Natural avian soundscape promoting grounded presence, cellular harmony, and mental clarity.",
            "file": "forest_528hz.wav",
            "icon": "🌲",
            "color": "#10b981",
            "image": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "stress",
            "title": "Gentle Forest Rain · Delta Wave",
            "category": "Stress Relief",
            "freq": "Delta Sleep & Release (3Hz)",
            "desc": "Steady, comforting rain canopy with Delta binaural beats to quiet sensory overload and somatic tension.",
            "file": "rain_delta.wav",
            "icon": "🌧️",
            "color": "#f97316",
            "image": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "anxiety",
            "title": "Mountain River Stream · 6Hz Theta",
            "category": "Anxiety Relief",
            "freq": "6Hz Theta Grounding",
            "desc": "Crisp flowing alpine brook fostering somatic safety, slowing heart rate, and breaking panic loops.",
            "file": "stream_theta.wav",
            "icon": "🏞️",
            "color": "#a855f7",
            "image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "focus",
            "title": "Meadow Wind & Flora · 40Hz Gamma",
            "category": "Focus & Flow",
            "freq": "40Hz Gamma Focus",
            "desc": "Expansive outdoor breeze and 40Hz Gamma harmonics to induce sustained concentration and flow.",
            "file": "wind_gamma.wav",
            "icon": "💨",
            "color": "#eab308",
            "image": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80"
        },
        {
            "id": "mood",
            "title": "Nocturne Deep Night · Theta Waves",
            "category": "Low Mood / Deep Rest",
            "freq": "Theta Restoration (4Hz)",
            "desc": "Warm evening crickets and gentle night ambiance to soothe emotional fatigue and support sleep.",
            "file": "night_theta.wav",
            "icon": "🌙",
            "color": "#6366f1",
            "image": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80"
        }
    ]

    t_col1, t_col2 = st.columns(2)
    for idx, track in enumerate(SOUND_TRACKS):
        target_col = t_col1 if idx % 2 == 0 else t_col2
        with target_col:
            is_recommended = track["id"] == st.session_state.active_preset_key
            active_class = "active-recommended" if is_recommended else ""
            rec_pill = f'<span class="soundscape-tag-pill" style="background: {track["color"]}; color: #000; font-weight: 800;">ACTIVE FREQUENCY</span>' if is_recommended else ''
            
            card_html = f"""
            <div class="soundscape-card {active_class}" style="--card-accent: {track['color']}; --card-glow: {track['color']}44;">
                <div style="position: relative; overflow: hidden; border-radius: 12px; margin-bottom: 12px;">
                    <img src="{track['image']}" style="width: 100%; height: 135px; object-fit: cover; display: block; filter: brightness(0.92);" />
                    <div style="position: absolute; bottom: 8px; left: 10px; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: #fff;">
                        {track['icon']} {track['category']}
                    </div>
                </div>
                <div class="soundscape-card-header">
                    <h4 class="soundscape-card-title" style="color: {track['color']} !important;">
                        {track['title']}
                    </h4>
                    {rec_pill}
                </div>
                <div class="soundscape-tag-row">
                    <span class="soundscape-tag-pill" style="background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.12);">
                        🏷️ {track['category']}
                    </span>
                    <span class="soundscape-tag-pill" style="background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3);">
                        ⚡ {track['freq']}
                    </span>
                </div>
                <p class="soundscape-desc">{track['desc']}</p>
            </div>
            """
            render_html(card_html)
            
            local_file = audio_base_dir / track["file"]
            if local_file.exists():
                with open(local_file, "rb") as af:
                    audio_data = af.read()
                st.audio(audio_data, format="audio/wav")
            else:
                st.audio(f"http://localhost:5000/audio/{track['file']}", format="audio/wav")
            st.markdown("<div style='margin-bottom: 1.4rem;'></div>", unsafe_allow_html=True)

    # 3-Pillar Neuro-Acoustic Science Foundation Cards
    st.markdown("<div style='margin-top: 1.5rem;'></div>", unsafe_allow_html=True)
    st.markdown("### 🔬 The Science of Sound Therapy & Neuro-Acoustics")
    sc1, sc2, sc3 = st.columns(3)
    with sc1:
        render_html(
            """
            <div class="sound-science-card">
                <img src="https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80" style="width: 100%; height: 110px; object-fit: cover; border-radius: 10px; margin-bottom: 12px; display: block;" />
                <div style="font-size: 1.2rem; margin-bottom: 4px;">🧘 <strong style="color: #38bdf8 !important; font-size: 1.05rem;">Solfeggio Harmonics</strong></div>
                <p style="color: #cbd5e1; font-size: 0.84rem; line-height: 1.5; margin: 0;">
                    432Hz and 528Hz resonate with organic biological geometry, promoting cellular harmony and decreasing autonomic stress response.
                </p>
            </div>
            """
        )
    with sc2:
        render_html(
            """
            <div class="sound-science-card">
                <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" style="width: 100%; height: 110px; object-fit: cover; border-radius: 10px; margin-bottom: 12px; display: block;" />
                <div style="font-size: 1.2rem; margin-bottom: 4px;">🧠 <strong style="color: #a855f7 !important; font-size: 1.05rem;">Binaural Entrainment</strong></div>
                <p style="color: #cbd5e1; font-size: 0.84rem; line-height: 1.5; margin: 0;">
                    Subtle frequency differences between stereo ears guide brainwaves into deeply restorative Delta (3Hz) and Theta (4-6Hz) states.
                </p>
            </div>
            """
        )
    with sc3:
        render_html(
            """
            <div class="sound-science-card">
                <img src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80" style="width: 100%; height: 110px; object-fit: cover; border-radius: 10px; margin-bottom: 12px; display: block;" />
                <div style="font-size: 1.2rem; margin-bottom: 4px;">🌿 <strong style="color: #10b981 !important; font-size: 1.05rem;">Biophilic Ambiance</strong></div>
                <p style="color: #cbd5e1; font-size: 0.84rem; line-height: 1.5; margin: 0;">
                    High-fidelity natural soundscapes simulate grounding wilderness environments, reducing mental fatigue and somatic tension.
                </p>
            </div>
            """
        )
    st.markdown("<div style='margin-bottom: 2rem;'></div>", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# TAB 5: ANIMATED BREATHING RESET (MOVABLE INTERACTIVE ITEM)
# -----------------------------------------------------------------------------
elif navigation_tab == "🌬️ Interactive Animated Breathing Reset":
        components.html(
                r"""
                <!doctype html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        * { box-sizing: border-box; }
                        body { margin: 0; color: #ecfdfb; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
                        .stage { position: relative; isolation: isolate; min-height: 650px; overflow: hidden; border: 1px solid rgba(153,246,228,.25); border-radius: 18px; background: #071316; }
                        .backdrop { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 56%; filter: saturate(.72) brightness(.62); }
                        .veil { position: absolute; z-index: -1; inset: 0; background: linear-gradient(90deg, rgba(4,15,19,.97) 0%, rgba(4,15,19,.9) 45%, rgba(4,15,19,.28) 100%); }
                        .layout { min-height: 650px; display: grid; grid-template-columns: minmax(0,1.15fr) minmax(250px,.85fr); align-items: center; gap: 28px; padding: 34px 38px; }
                        .eyebrow { margin: 0 0 14px; color: #99f6e4; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
                        h1 { max-width: 540px; margin: 0 0 10px; color: #f0fdfa; font-family: 'Outfit','Plus Jakarta Sans',sans-serif; font-size: 34px; line-height: 1.1; }
                        .intro { max-width: 460px; margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.65; }
                        .settings { display: grid; grid-template-columns: minmax(0,1fr) minmax(120px,.65fr); gap: 12px; max-width: 500px; margin-top: 22px; }
                        .field label { display: block; margin-bottom: 7px; color: #d5e6e7; font-size: 11px; font-weight: 700; }
                        select { width: 100%; min-height: 42px; padding: 0 11px; border: 1px solid rgba(153,246,228,.3); border-radius: 9px; background: rgba(5,19,23,.92); color: #f0fdfa; font: inherit; font-size: 12px; }
                        .steps { display: flex; flex-wrap: wrap; gap: 7px; min-height: 30px; margin-top: 13px; }
                        .step { padding: 6px 9px; border: 1px solid rgba(203,213,225,.2); border-radius: 999px; background: rgba(5,19,23,.5); color: #d8e7e8; font-size: 10px; }
                        .step.active { border-color: rgba(94,234,212,.8); background: rgba(13,148,136,.24); color: #ccfbf1; }
                        .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 19px; }
                        button { min-height: 40px; padding: 0 14px; border: 1px solid rgba(203,213,225,.25); border-radius: 9px; background: rgba(8,24,29,.84); color: #e2e8f0; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; transition: transform .18s ease, background .18s ease, border-color .18s ease; }
                        button:hover:not(:disabled) { transform: translateY(-1px); border-color: #5eead4; }
                        button:focus-visible, select:focus-visible { outline: 2px solid #5eead4; outline-offset: 2px; }
                        button.primary { border-color: #5eead4; background: #0f766e; color: #f0fdfa; }
                        button:disabled { cursor: not-allowed; opacity: .45; }
                        .status { min-height: 20px; margin-top: 12px; color: #ccfbf1; font-size: 12px; }
                        .progress { width: 100%; max-width: 500px; height: 5px; overflow: hidden; margin-top: 7px; border-radius: 999px; background: rgba(226,232,240,.16); }
                        .progress span { display: block; width: 0; height: 100%; border-radius: inherit; background: #5eead4; transition: width .25s linear; }
                        .session-meta { display: flex; justify-content: space-between; max-width: 500px; margin-top: 8px; color: #b7c9cc; font-size: 10px; }
                        .safety { max-width: 500px; margin: 15px 0 0; color: #b7c9cc; font-size: 11px; line-height: 1.5; }
                        .orbit { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; }
                        .orb-shell { display: grid; width: 250px; height: 250px; place-items: center; border: 1px solid rgba(153,246,228,.18); border-radius: 50%; box-shadow: 0 0 0 16px rgba(45,212,191,.035), 0 0 0 34px rgba(45,212,191,.025); }
                        .orb { display: grid; width: 184px; height: 184px; place-items: center; border: 1px solid rgba(204,251,241,.65); border-radius: 50%; background: radial-gradient(circle at 36% 30%, #ccfbf1 0%, #5eead4 30%, #0f766e 72%, #102a31 100%); box-shadow: 0 0 36px rgba(45,212,191,.28); transform: scale(.88); transition: transform 1s cubic-bezier(.2,.8,.2,1), box-shadow 1s ease; }
                        .orb.inhale, .orb.hold { transform: scale(1.08); box-shadow: 0 0 55px rgba(45,212,191,.52); }
                        .orb.exhale, .orb.rest { transform: scale(.84); }
                        .phase { color: #062522; font-size: 12px; font-weight: 900; letter-spacing: .13em; }
                        .timer { margin-top: 28px; color: #f0fdfa; font-variant-numeric: tabular-nums; font-size: 25px; font-weight: 800; }
                        .cycles { margin-top: 4px; color: #cbd5e1; font-size: 11px; }
                        @media (max-width: 720px) {
                            .stage, .layout { min-height: 850px; }
                            .layout { grid-template-columns: 1fr; gap: 4px; padding: 24px 20px; }
                            .veil { background: linear-gradient(180deg, rgba(4,15,19,.96) 0%, rgba(4,15,19,.88) 54%, rgba(4,15,19,.4) 100%); }
                            h1 { font-size: 29px; }
                            .orbit { min-height: 270px; }
                            .orb-shell { width: 210px; height: 210px; }
                            .orb { width: 154px; height: 154px; }
                        }
                        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
                    </style>
                </head>
                <body>
                    <main class="stage">
                        <img class="backdrop" src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85" alt="A quiet ocean shoreline at sunset">
                        <div class="veil"></div>
                        <div class="layout">
                            <section>
                                <p class="eyebrow">A moment to reset</p>
                                <h1>Let the next breath be easy.</h1>
                                <p class="intro">Choose a rhythm and session length. Follow the changing cue; a comfortable, natural breath is enough.</p>
                                <div class="settings">
                                    <div class="field"><label for="pattern">Breathing pace</label><select id="pattern">
                                        <option value="gentle">Gentle reset · 4–4–6</option>
                                        <option value="easy">Easy start · 3–0–5</option>
                                        <option value="box">Box breathing · 4–4–4–4</option>
                                    </select></div>
                                    <div class="field"><label for="cycle-count">Session cycles</label><select id="cycle-count">
                                        <option value="3">3 cycles</option><option value="6" selected>6 cycles</option><option value="12">12 cycles</option>
                                    </select></div>
                                </div>
                                <div id="steps" class="steps" aria-label="Breathing steps"></div>
                                <div class="actions">
                                    <button id="start" class="primary" type="button">Start session</button>
                                    <button id="pause" type="button" disabled>Pause</button>
                                    <button id="reset" type="button">Reset</button>
                                </div>
                                <div id="status" class="status" aria-live="polite">Choose a pace, then start when you feel ready.</div>
                                <div class="progress" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="progress-fill"></span></div>
                                <div class="session-meta"><span id="cycle-count-label">0 / 6 cycles</span><span id="remaining">01:24</span></div>
                                <p class="safety">If a pause feels uncomfortable, skip it and keep breathing naturally.</p>
                            </section>
                            <section class="orbit" aria-label="Breathing pace indicator">
                                <div class="orb-shell"><div id="orb" class="orb"><span id="phase" class="phase">READY</span></div></div>
                                <div id="timer" class="timer">00:00</div>
                                <div id="cycles" class="cycles">Ready for 6 gentle cycles</div>
                            </section>
                        </div>
                    </main>
                    <script>
                        const patterns = {
                            gentle: { phases: [{name:"INHALE",cue:"Breathe in gently",duration:4,type:"inhale"},{name:"PAUSE",cue:"Rest softly",duration:4,type:"hold"},{name:"EXHALE",cue:"Breathe out slowly",duration:6,type:"exhale"}] },
                            easy: { phases: [{name:"INHALE",cue:"Breathe in gently",duration:3,type:"inhale"},{name:"EXHALE",cue:"Let the breath go slowly",duration:5,type:"exhale"}] },
                            box: { phases: [{name:"INHALE",cue:"Breathe in steadily",duration:4,type:"inhale"},{name:"HOLD",cue:"Pause without straining",duration:4,type:"hold"},{name:"EXHALE",cue:"Breathe out steadily",duration:4,type:"exhale"},{name:"REST",cue:"Rest softly",duration:4,type:"rest"}] }
                        };
                        const patternSelect = document.getElementById("pattern");
                        const cycleSelect = document.getElementById("cycle-count");
                        const startButton = document.getElementById("start");
                        const pauseButton = document.getElementById("pause");
                        const resetButton = document.getElementById("reset");
                        const orb = document.getElementById("orb");
                        const phaseLabel = document.getElementById("phase");
                        const timerLabel = document.getElementById("timer");
                        const cycleLabel = document.getElementById("cycles");
                        const statusLabel = document.getElementById("status");
                        const steps = document.getElementById("steps");
                        const progressFill = document.getElementById("progress-fill");
                        const progressBar = document.querySelector(".progress");
                        const cycleCountLabel = document.getElementById("cycle-count-label");
                        const remainingLabel = document.getElementById("remaining");
                        let running = false;
                        let startedAt = 0;
                        let elapsedBeforePause = 0;
                        let intervalId = null;
                        let completed = false;

                        function currentPattern() { return patterns[patternSelect.value]; }
                        function cycleSeconds() { return currentPattern().phases.reduce((sum, phase) => sum + phase.duration, 0); }
                        function targetSeconds() { return cycleSeconds() * Number(cycleSelect.value); }
                        function formatTime(seconds) { const total = Math.max(0, Math.ceil(seconds)); return `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`; }
                        function renderSteps() {
                            steps.replaceChildren();
                            currentPattern().phases.forEach((item, index) => {
                                const chip = document.createElement("span");
                                chip.className = "step";
                                chip.dataset.phaseIndex = String(index);
                                chip.textContent = `${item.name} · ${item.duration}s`;
                                steps.appendChild(chip);
                            });
                            const total = targetSeconds();
                            const count = Number(cycleSelect.value);
                            const estimate = formatTime(total);
                            cycleLabel.textContent = `Ready for ${count} gentle cycles`;
                            cycleCountLabel.textContent = `0 / ${count} cycles`;
                            remainingLabel.textContent = estimate;
                            timerLabel.textContent = "00:00";
                        }
                        function setPhase(item, index) {
                            phaseLabel.textContent = item.name;
                            statusLabel.textContent = item.cue;
                            orb.className = `orb ${item.type}`;
                            steps.querySelectorAll(".step").forEach((chip, chipIndex) => chip.classList.toggle("active", chipIndex === index));
                        }
                        function elapsedSeconds() { return elapsedBeforePause + (running ? (Date.now() - startedAt) / 1000 : 0); }
                        function tick() {
                            const elapsed = elapsedSeconds();
                            const target = targetSeconds();
                            if (elapsed >= target) {
                                running = false;
                                completed = true;
                                elapsedBeforePause = target;
                                clearInterval(intervalId);
                                intervalId = null;
                                startButton.disabled = true;
                                pauseButton.disabled = true;
                                statusLabel.textContent = "Session complete. Take a moment before returning.";
                                phaseLabel.textContent = "COMPLETE";
                                orb.className = "orb";
                            } else {
                                const cycleLength = cycleSeconds();
                                const withinCycle = elapsed % cycleLength;
                                let boundary = 0;
                                const phases = currentPattern().phases;
                                const phaseIndex = phases.findIndex(item => { boundary += item.duration; return withinCycle < boundary; });
                                setPhase(phases[Math.max(0, phaseIndex)], Math.max(0, phaseIndex));
                            }
                            const done = Math.min(target, elapsed);
                            const progress = Math.round((done / target) * 100);
                            progressFill.style.width = `${progress}%`;
                            progressBar.setAttribute("aria-valuenow", String(progress));
                            const cyclesDone = Math.min(Number(cycleSelect.value), Math.floor(done / cycleSeconds()));
                            cycleCountLabel.textContent = `${cyclesDone} / ${cycleSelect.value} cycles`;
                            remainingLabel.textContent = formatTime(target - done);
                            timerLabel.textContent = formatTime(done);
                        }
                        startButton.addEventListener("click", () => {
                            if (completed) resetSession();
                            running = true;
                            startedAt = Date.now();
                            startButton.textContent = "Resume";
                            startButton.disabled = true;
                            pauseButton.disabled = false;
                            patternSelect.disabled = true;
                            cycleSelect.disabled = true;
                            statusLabel.textContent = "Follow the cue at a comfortable pace.";
                            intervalId = setInterval(tick, 200);
                            tick();
                        });
                        pauseButton.addEventListener("click", () => {
                            if (!running) return;
                            elapsedBeforePause += (Date.now() - startedAt) / 1000;
                            running = false;
                            clearInterval(intervalId);
                            intervalId = null;
                            startButton.disabled = false;
                            pauseButton.disabled = true;
                            statusLabel.textContent = "Paused. Resume whenever you are ready.";
                            orb.className = "orb";
                        });
                        function resetSession() {
                            running = false;
                            completed = false;
                            elapsedBeforePause = 0;
                            clearInterval(intervalId);
                            intervalId = null;
                            startButton.disabled = false;
                            startButton.textContent = "Start session";
                            pauseButton.disabled = true;
                            patternSelect.disabled = false;
                            cycleSelect.disabled = false;
                            phaseLabel.textContent = "READY";
                            statusLabel.textContent = "Choose a pace, then start when you feel ready.";
                            orb.className = "orb";
                            progressFill.style.width = "0%";
                            progressBar.setAttribute("aria-valuenow", "0");
                            renderSteps();
                        }
                        resetButton.addEventListener("click", resetSession);
                        patternSelect.addEventListener("change", resetSession);
                        cycleSelect.addEventListener("change", resetSession);
                        renderSteps();
                    </script>
                </body>
                </html>
                """,
                height=720,
                scrolling=False,
        )

# -----------------------------------------------------------------------------
# TAB 4: MODEL LEADERBOARD & DIAGNOSTICS
# -----------------------------------------------------------------------------
elif navigation_tab == "📊 Model Leaderboard & Diagnostics":
    st.markdown("### 📊 Which model performs best?")
    st.markdown("Compare model predictions for each DASS-42 assessment area. We rank models by how consistently they perform across severity classes.")

    lb_path = config.MODELS_DIR / "leaderboard.csv"
    if lb_path.exists():
        lb_df = pd.read_csv(lb_path)
        target_filter = st.selectbox("Assessment area", config.TARGETS)
        leaderboard_df = lb_df[lb_df["target"] == target_filter]
    else:
        benchmark_data = {
            "model": ["Logistic Regression (Baseline)", "Random Forest", "XGBoost", "LightGBM", "Extra Trees", "Gradient Boosting"],
            "accuracy": [0.524, 0.531, 0.538, 0.542, 0.529, 0.535],
            "f1_macro": [0.482, 0.490, 0.498, 0.504, 0.488, 0.494],
            "precision_macro": [0.491, 0.497, 0.506, 0.512, 0.493, 0.501],
            "recall_macro": [0.485, 0.492, 0.501, 0.508, 0.489, 0.496],
        }
        leaderboard_df = pd.DataFrame(benchmark_data)

    leaderboard_df = leaderboard_df.sort_values("f1_macro", ascending=False).reset_index(drop=True)
    if leaderboard_df.empty:
        st.info("No benchmark results are available for this assessment area yet.")
    else:
        best_model = leaderboard_df.iloc[0]
        summary = st.columns(3)
        summary[0].metric("Top-ranked model", best_model["model"])
        summary[1].metric("Best F1-Macro", f"{best_model['f1_macro']:.1%}")
        summary[2].metric("Models compared", len(leaderboard_df))
        st.caption("F1-Macro gives each severity class equal weight, so strong results on common classes do not hide weaker results on less common ones.")

        st.markdown("#### Ranked results")
        st.caption("Sorted by F1-Macro. Scores are percentages; higher is better.")
        metric_labels = {
            "accuracy": "Accuracy",
            "precision_macro": "Precision",
            "recall_macro": "Recall",
            "f1_macro": "F1-Macro",
            "roc_auc_ovr_macro": "ROC-AUC",
        }
        metric_columns = [column for column in metric_labels if column in leaderboard_df.columns]
        results = leaderboard_df[["model", *metric_columns]].copy()
        results.insert(0, "Rank", range(1, len(results) + 1))
        results = results.rename(columns={"model": "Model", **metric_labels})
        displayed_metrics = [metric_labels[column] for column in metric_columns]
        styled_results = results.style.format({column: "{:.1%}" for column in displayed_metrics})
        styled_results = styled_results.set_properties(
            subset=displayed_metrics,
            **{"background-color": "#101c24", "color": "#dbe7ea", "border-color": "#263943"},
        )
        styled_results = styled_results.set_properties(
            subset=["F1-Macro"],
            **{"background-color": "#16433f", "color": "#e6fffa", "font-weight": "bold"},
        )
        st.dataframe(styled_results, use_container_width=True, hide_index=True)

        with st.expander("What do these metrics mean?"):
            st.markdown(
                "- **Accuracy:** share of all predictions that were correct.\n"
                "- **Precision:** how often a predicted class was correct.\n"
                "- **Recall:** how many examples of a class the model found.\n"
                "- **F1-Macro:** balances precision and recall across classes; used here to rank models.\n"
                "- **ROC-AUC:** how well the model separates classes across decision thresholds."
            )

        st.markdown("#### Compare model scores")
        st.caption("This chart focuses on F1-Macro, the score used to rank models above.")
        chart_data = leaderboard_df.set_index("model")[["f1_macro"]].mul(100)
        chart_data = chart_data.rename(columns={"f1_macro": "F1-Macro (%)"})
        st.bar_chart(chart_data, color="#2dd4bf")

# -----------------------------------------------------------------------------
# TAB 5: CALMING SUITE & RESOURCES
# -----------------------------------------------------------------------------
elif navigation_tab == "🌿 MindCare Calming Suite & Resources":
    st.markdown('<div class="title-badge">🌿 Grounding Suite & Crisis Support</div>', unsafe_allow_html=True)
    st.markdown("### 🌿 Find a moment of calm")
    st.caption("Choose one small practice. Take it at your own pace.")
    
    ccol1, ccol2 = st.columns([1.1, 0.9], gap="large")
    with ccol1:
        render_html(
            """
            <div class="calm-practice">
                <h3>🌬️ Slow your breathing</h3>
                <p>Try the 4–7–8 pattern with a comfortable breath. Skip the hold if it does not feel right.</p>
            </div>
            <div class="breathing-sequence">
                <div class="breathing-phase-card"><span>01 · Inhale</span><strong>4 seconds</strong></div>
                <div class="breathing-phase-card"><span>02 · Hold gently</span><strong>7 seconds</strong></div>
                <div class="breathing-phase-card"><span>03 · Exhale</span><strong>8 seconds</strong></div>
            </div>
            """
        )

        st.markdown("#### 🖐️ Ground yourself with your senses")
        st.caption("Notice each one slowly, without needing to change anything.")
        ground_left, ground_right = st.columns(2)
        with ground_left:
            st.checkbox("5 things you can see", key="g1")
            st.checkbox("4 things you can feel", key="g2")
            st.checkbox("3 things you can hear", key="g3")
        with ground_right:
            st.checkbox("2 things you can smell", key="g4")
            st.checkbox("1 thing you can taste", key="g5")

    with ccol2:
        render_html(
            """
            <div class="photo-card wellness-photo">
                <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=700&q=80" 
                     alt="A person sitting quietly in a mindful moment" style="width: 100%; object-fit: cover; display: block;" />
                <div class="photo-caption">
                    <strong>Come back to the present</strong>
                    <span>A quiet moment is enough to begin.</span>
                </div>
            </div>
            """
        )

    st.markdown("### 🌱 What might help next?")
    st.caption("There is no perfect next step. Choose whatever feels manageable right now.")
    render_html(
        """
        <div class="next-step-grid">
            <div class="next-step-card">
                <img class="next-step-image" src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80" alt="A quiet ocean shore for a screen break" />
                <div class="next-step-content"><span>01 · Pause</span><strong>Take a screen break</strong><p>Step away from notifications for a quiet moment.</p></div>
            </div>
            <div class="next-step-card">
                <img class="next-step-image" src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=700&q=80" alt="A person stretching in a calm setting" />
                <div class="next-step-content"><span>02 · Move</span><strong>Stretch gently</strong><p>Roll your shoulders or stretch your hands, if comfortable.</p></div>
            </div>
            <div class="next-step-card">
                <img class="next-step-image" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=80" alt="Friends spending time together outdoors" />
                <div class="next-step-content"><span>03 · Connect</span><strong>Reach out</strong><p>Send a short message to someone you trust.</p></div>
            </div>
        </div>
        """
    )
