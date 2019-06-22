import path from 'path'
import { spawnSync } from 'child_process'

export const npm = (args, options) =>
  spawnSync('npm', args, { cwd: path.join(__dirname, 'service'), ...options })
export const sls = (args, options) =>
  spawnSync('npx', ['serverless', ...args], { cwd: path.join(__dirname, 'service'), ...options })
