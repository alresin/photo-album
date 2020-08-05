using System;
using System.Runtime.InteropServices;


class Foo {
	[DllImport("shell32.dll")]
	static extern void SHChangeNotify(long a, uint b, IntPtr c, IntPtr d);


	public static void Main() {
		SHChangeNotify(0x08000000, 0, IntPtr.Zero, IntPtr.Zero);
	}
}
