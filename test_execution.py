import asyncio
from execution.adapter import TriggerEvent
from execution.keeperhub import execute_rebalance

async def main():
    trigger = TriggerEvent(
        protocol="aave",
        action="withdraw-all",
        reason="Critical security vulnerability detected in governance module",
        score=25.0,
        delta=-50.0
    )
    print("Testing KeeperHub Execution Agent...")
    await execute_rebalance(trigger, "0x1234567890123456789012345678901234567890")

if __name__ == "__main__":
    asyncio.run(main())
