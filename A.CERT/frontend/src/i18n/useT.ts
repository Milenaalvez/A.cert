'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from './LocaleContext';
import { locales, type Locale } from './locales';

const messageCache: Record<string, Record<string, any>> = {};

async function loadMessages(locale: string): Promise<Record<string, any>> {
  if (messageCache[locale] && Object.keys(messageCache[locale]).length > 0) {
    return messageCache[locale];
  }
  try {
    const mod = await import(
      /* webpackMode: "lazy", webpackChunkName: "msgs" */
      `../../messages/${locale}.json`
    );
    messageCache[locale] = mod.default || mod;
    return messageCache[locale];
  } catch {
    if (locale !== 'pt-BR') {
      return loadMessages('pt-BR');
    }
    return {};
  }
}

export function useT() {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<Record<string, any>>(
    messageCache[locale] && Object.keys(messageCache[locale]).length > 0
      ? messageCache[locale]
      : {}
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    loadMessages(locale).then((msgs) => {
      setMessages(msgs);
      setReady(true);
    });
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    if (typeof value !== 'string') {
      if (locale !== 'pt-BR') {
        const fallback = messageCache['pt-BR'] || {};
        let fb: any = fallback;
        for (const k of keys) {
          if (fb && typeof fb === 'object') fb = fb[k];
          else { fb = undefined; break; }
        }
        if (typeof fb === 'string') value = fb;
      }
      if (typeof value !== 'string') return key;
    }
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_: string, p: string) => String(params[p] ?? `{${p}}`));
    }
    return value;
  }, [messages, locale]);

  return { t, locale, locales, ready };
}

export { locales, type Locale };
