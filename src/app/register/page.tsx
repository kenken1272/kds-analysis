// src/app/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getFirebase } from "@/lib/firebase/client";

const RegisterPage = () => {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { auth, firestore } = getFirebase();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const orgRef = doc(collection(firestore, "orgs"));
      await setDoc(orgRef, {
        name: orgName,
        ownerUid: credential.user.uid,
      });
      await setDoc(doc(firestore, "users", credential.user.uid), {
        email,
        orgId: orgRef.id,
      });
      router.push("/saved");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/10 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <UserPlus className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">新規登録</CardTitle>
          <p className="text-sm text-muted-foreground">団体を作成し、分析を保存しましょう</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">団体名</label>
              <Input
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">メールアドレス</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">パスワード</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登録中..." : "登録"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <span>既にアカウントをお持ちですか？</span>
          <Link href="/login" className="text-primary underline">
            ログイン
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
};

export default RegisterPage;
