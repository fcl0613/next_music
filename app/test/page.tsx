'use client'

import { useState } from "react"

function Test() {
    const [count,setCount] = useState<number>(0)
    return (
        <>
            <div style={{ margin:0 }} onClick={() => {setCount(count+1)}}>test{count}</div>
        </>
    )
}

export default Test